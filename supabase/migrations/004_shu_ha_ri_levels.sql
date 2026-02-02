-- ============================================
-- MIGRATION 004: Shu-Ha-Ri Ceremony Levels
-- ============================================

-- Add ceremony level to teams
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS ceremony_level TEXT DEFAULT 'shu' CHECK (ceremony_level IN ('shu', 'ha', 'ri'));

ALTER TABLE teams
ADD COLUMN IF NOT EXISTS ceremony_level_updated_at TIMESTAMPTZ DEFAULT NULL;

-- Add follow_up_recorded to delta_sessions (if it doesn't exist)
-- This tracks whether follow-up was recorded for the session
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'delta_sessions' AND column_name = 'follow_up_recorded'
  ) THEN
    ALTER TABLE delta_sessions ADD COLUMN follow_up_recorded BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add participation_rate to delta_sessions (if it doesn't exist)
-- Calculated as responses / expected_team_size
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'delta_sessions' AND column_name = 'participation_rate'
  ) THEN
    ALTER TABLE delta_sessions ADD COLUMN participation_rate NUMERIC(3,2) DEFAULT NULL;
  END IF;
END $$;

-- Add overall_score to delta_sessions (if it doesn't exist)
-- Average score across all responses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'delta_sessions' AND column_name = 'overall_score'
  ) THEN
    ALTER TABLE delta_sessions ADD COLUMN overall_score NUMERIC(3,2) DEFAULT NULL;
  END IF;
END $$;

-- Index for level queries
CREATE INDEX IF NOT EXISTS idx_teams_ceremony_level ON teams(ceremony_level);

-- Index for session queries by date
CREATE INDEX IF NOT EXISTS idx_delta_sessions_closed_at ON delta_sessions(closed_at DESC);
CREATE INDEX IF NOT EXISTS idx_delta_sessions_team_closed ON delta_sessions(team_id, closed_at DESC);

-- ============================================
-- FUNCTION: Evaluate ceremony level for a team
-- ============================================

CREATE OR REPLACE FUNCTION evaluate_ceremony_level(p_team_id UUID)
RETURNS JSON AS $$
DECLARE
  v_current_level TEXT;
  v_sessions_30d INTEGER;
  v_sessions_45d INTEGER;
  v_sessions_total INTEGER;
  v_followups_count INTEGER;
  v_unique_angles INTEGER;
  v_last_2_avg_score NUMERIC;
  v_last_3_avg_score NUMERIC;
  v_last_2_participation NUMERIC;
  v_last_3_participation NUMERIC;
  v_days_since_last_session INTEGER;
  v_new_level TEXT;
  v_risk_state TEXT := 'none';
  v_risk_reason TEXT := NULL;
  v_can_unlock_ha BOOLEAN := FALSE;
  v_can_unlock_ri BOOLEAN := FALSE;
BEGIN
  -- Get current level
  SELECT ceremony_level INTO v_current_level FROM teams WHERE id = p_team_id;
  v_current_level := COALESCE(v_current_level, 'shu');

  -- Count sessions in last 30 days with follow-up
  SELECT COUNT(*) INTO v_sessions_30d
  FROM delta_sessions
  WHERE team_id = p_team_id
    AND status = 'closed'
    AND closed_at >= NOW() - INTERVAL '30 days'
    AND follow_up_recorded = TRUE;

  -- Count sessions in last 45 days
  SELECT COUNT(*) INTO v_sessions_45d
  FROM delta_sessions
  WHERE team_id = p_team_id
    AND status = 'closed'
    AND closed_at >= NOW() - INTERVAL '45 days';

  -- Total closed sessions with follow-up
  SELECT COUNT(*) INTO v_sessions_total
  FROM delta_sessions
  WHERE team_id = p_team_id
    AND status = 'closed';

  -- Count sessions with follow-up recorded
  SELECT COUNT(*) INTO v_followups_count
  FROM delta_sessions
  WHERE team_id = p_team_id
    AND status = 'closed'
    AND follow_up_recorded = TRUE;

  -- Count unique ceremony types (angles)
  SELECT COUNT(DISTINCT angle) INTO v_unique_angles
  FROM delta_sessions
  WHERE team_id = p_team_id
    AND status = 'closed';

  -- Average score of last 2 sessions
  SELECT AVG(overall_score) INTO v_last_2_avg_score
  FROM (
    SELECT overall_score FROM delta_sessions
    WHERE team_id = p_team_id AND status = 'closed' AND overall_score IS NOT NULL
    ORDER BY closed_at DESC LIMIT 2
  ) sub;

  -- Average score of last 3 sessions
  SELECT AVG(overall_score) INTO v_last_3_avg_score
  FROM (
    SELECT overall_score FROM delta_sessions
    WHERE team_id = p_team_id AND status = 'closed' AND overall_score IS NOT NULL
    ORDER BY closed_at DESC LIMIT 3
  ) sub;

  -- Participation of last 2 sessions
  SELECT AVG(participation_rate) INTO v_last_2_participation
  FROM (
    SELECT participation_rate FROM delta_sessions
    WHERE team_id = p_team_id AND status = 'closed' AND participation_rate IS NOT NULL
    ORDER BY closed_at DESC LIMIT 2
  ) sub;

  -- Participation of last 3 sessions
  SELECT AVG(participation_rate) INTO v_last_3_participation
  FROM (
    SELECT participation_rate FROM delta_sessions
    WHERE team_id = p_team_id AND status = 'closed' AND participation_rate IS NOT NULL
    ORDER BY closed_at DESC LIMIT 3
  ) sub;

  -- Days since last session
  SELECT EXTRACT(DAY FROM NOW() - MAX(closed_at))::INTEGER INTO v_days_since_last_session
  FROM delta_sessions
  WHERE team_id = p_team_id AND status = 'closed';

  -- Check Shu -> Ha unlock criteria
  -- Evidence: 3+ sessions in 30d with follow-up, 5+ different angles (breadth)
  -- Stability: avg score >= 3.2, participation >= 60%
  IF v_sessions_30d >= 3
     AND v_unique_angles >= 5
     AND COALESCE(v_last_2_avg_score, 0) >= 3.2
     AND COALESCE(v_last_2_participation, 0) >= 0.60 THEN
    v_can_unlock_ha := TRUE;
  END IF;

  -- Check Ha -> Ri unlock criteria
  -- Evidence: 6+ total sessions, 7+ types (near-complete breadth), 4+ followups, 3+ in 45d
  -- Stability: avg score >= 3.5, participation >= 70%
  IF v_sessions_total >= 6
     AND v_unique_angles >= 7
     AND v_followups_count >= 4
     AND v_sessions_45d >= 3
     AND COALESCE(v_last_3_avg_score, 0) >= 3.5
     AND COALESCE(v_last_3_participation, 0) >= 0.70 THEN
    v_can_unlock_ri := TRUE;
  END IF;

  -- Determine new level (can only go up)
  v_new_level := v_current_level;
  IF v_current_level = 'shu' AND v_can_unlock_ha THEN
    v_new_level := 'ha';
  ELSIF v_current_level = 'ha' AND v_can_unlock_ri THEN
    v_new_level := 'ri';
  END IF;

  -- Check for risk states (no regression, just advisory)
  IF COALESCE(v_last_2_avg_score, 5) < 3.0 THEN
    v_risk_state := 'slipping';
    v_risk_reason := 'Low scores in recent sessions';
  ELSIF COALESCE(v_last_2_participation, 1) < 0.50 THEN
    v_risk_state := 'low_participation';
    v_risk_reason := 'Low participation in recent sessions';
  ELSIF COALESCE(v_days_since_last_session, 0) > 21 THEN
    v_risk_state := 'stale';
    v_risk_reason := 'No sessions in 21+ days';
  END IF;

  -- Update level if changed
  IF v_new_level != v_current_level THEN
    UPDATE teams
    SET ceremony_level = v_new_level,
        ceremony_level_updated_at = NOW()
    WHERE id = p_team_id;
  END IF;

  -- Return result
  RETURN json_build_object(
    'level', v_new_level,
    'previous_level', v_current_level,
    'level_changed', v_new_level != v_current_level,
    'risk', json_build_object(
      'state', v_risk_state,
      'reason', v_risk_reason
    ),
    'progress', json_build_object(
      'sessions_30d', v_sessions_30d,
      'sessions_45d', v_sessions_45d,
      'sessions_total', v_sessions_total,
      'followups_count', v_followups_count,
      'unique_angles', v_unique_angles,
      'last_2_avg_score', v_last_2_avg_score,
      'last_3_avg_score', v_last_3_avg_score,
      'last_2_participation', v_last_2_participation,
      'last_3_participation', v_last_3_participation,
      'days_since_last_session', v_days_since_last_session,
      'can_unlock_ha', v_can_unlock_ha,
      'can_unlock_ri', v_can_unlock_ri
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION evaluate_ceremony_level TO authenticated;
