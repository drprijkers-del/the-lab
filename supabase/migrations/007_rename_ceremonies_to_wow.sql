-- Migration: Rename "Ceremonies" to "Way of Work" (wow)
-- This migration updates the tool identifier from 'delta' to 'wow' in team_tools
-- and renames ceremony-related columns to wow-prefixed names.

-- 1. Update tool identifier in team_tools: 'delta' -> 'wow'
UPDATE team_tools SET tool = 'wow' WHERE tool = 'delta';

-- 2. Update the CHECK constraint on team_tools.tool
ALTER TABLE team_tools DROP CONSTRAINT IF EXISTS team_tools_tool_check;
ALTER TABLE team_tools ADD CONSTRAINT team_tools_tool_check CHECK (tool IN ('vibe', 'wow'));

-- 3. Also update any 'pulse' entries to 'vibe' for consistency
UPDATE team_tools SET tool = 'vibe' WHERE tool = 'pulse';

-- 4. Rename ceremony_level column to wow_level
ALTER TABLE teams RENAME COLUMN ceremony_level TO wow_level;
ALTER TABLE teams RENAME COLUMN ceremony_level_updated_at TO wow_level_updated_at;

-- 5. Rename the index
DROP INDEX IF EXISTS idx_teams_ceremony_level;
CREATE INDEX idx_teams_wow_level ON teams(wow_level);

-- 6. Update the evaluate_ceremony_level function to evaluate_wow_level
CREATE OR REPLACE FUNCTION evaluate_wow_level(p_team_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_current_level TEXT;
  v_new_level TEXT;
  v_sessions_30d INT;
  v_sessions_45d INT;
  v_sessions_total INT;
  v_unique_angles INT;
  v_followups INT;
  v_last_2_avg NUMERIC;
  v_last_3_avg NUMERIC;
  v_last_2_part NUMERIC;
  v_last_3_part NUMERIC;
  v_days_since INT;
  v_can_ha BOOLEAN := FALSE;
  v_can_ri BOOLEAN := FALSE;
  v_risk_state TEXT := 'none';
  v_risk_reason TEXT := NULL;
BEGIN
  -- Get current level
  SELECT COALESCE(wow_level, 'shu') INTO v_current_level
  FROM teams WHERE id = p_team_id;

  -- Count sessions in various windows
  SELECT COUNT(*) INTO v_sessions_30d
  FROM delta_sessions
  WHERE team_id = p_team_id AND status = 'closed'
    AND closed_at > NOW() - INTERVAL '30 days';

  SELECT COUNT(*) INTO v_sessions_45d
  FROM delta_sessions
  WHERE team_id = p_team_id AND status = 'closed'
    AND closed_at > NOW() - INTERVAL '45 days';

  SELECT COUNT(*) INTO v_sessions_total
  FROM delta_sessions
  WHERE team_id = p_team_id AND status = 'closed';

  -- Count unique angles
  SELECT COUNT(DISTINCT angle) INTO v_unique_angles
  FROM delta_sessions
  WHERE team_id = p_team_id AND status = 'closed';

  -- Count follow-ups
  SELECT COUNT(*) INTO v_followups
  FROM delta_sessions
  WHERE team_id = p_team_id AND status = 'closed'
    AND followup_date IS NOT NULL;

  -- Average score of last 2 closed sessions
  SELECT AVG(sub.avg_score) INTO v_last_2_avg
  FROM (
    SELECT AVG(dr.answers_avg) AS avg_score
    FROM delta_sessions ds
    JOIN LATERAL (
      SELECT AVG(val::NUMERIC) AS answers_avg
      FROM delta_responses r, jsonb_each_text(r.answers) AS t(key, val)
      WHERE r.session_id = ds.id
    ) dr ON TRUE
    WHERE ds.team_id = p_team_id AND ds.status = 'closed'
    ORDER BY ds.closed_at DESC
    LIMIT 2
  ) sub;

  -- Average score of last 3 closed sessions
  SELECT AVG(sub.avg_score) INTO v_last_3_avg
  FROM (
    SELECT AVG(dr.avg_score) AS avg_score
    FROM delta_sessions ds
    JOIN LATERAL (
      SELECT AVG(val::NUMERIC) AS avg_score
      FROM delta_responses r, jsonb_each_text(r.answers) AS t(key, val)
      WHERE r.session_id = ds.id
    ) dr ON TRUE
    WHERE ds.team_id = p_team_id AND ds.status = 'closed'
    ORDER BY ds.closed_at DESC
    LIMIT 3
  ) sub;

  -- Days since last session
  SELECT EXTRACT(DAY FROM NOW() - MAX(closed_at))::INT INTO v_days_since
  FROM delta_sessions
  WHERE team_id = p_team_id AND status = 'closed';

  -- Evaluate Shu -> Ha requirements
  v_can_ha := v_sessions_30d >= 3
    AND v_unique_angles >= 5
    AND COALESCE(v_last_2_avg, 0) >= 3.2;

  -- Evaluate Ha -> Ri requirements
  v_can_ri := v_sessions_total >= 6
    AND v_unique_angles >= 7
    AND v_followups >= 4
    AND v_sessions_45d >= 3
    AND COALESCE(v_last_3_avg, 0) >= 3.5;

  -- Determine new level (only upgrade, never downgrade)
  v_new_level := v_current_level;
  IF v_current_level = 'shu' AND v_can_ha THEN
    v_new_level := 'ha';
  ELSIF v_current_level = 'ha' AND v_can_ri THEN
    v_new_level := 'ri';
  END IF;

  -- Risk assessment
  IF v_days_since IS NOT NULL AND v_days_since > 30 THEN
    v_risk_state := 'stale';
    v_risk_reason := 'No sessions in over 30 days';
  END IF;

  -- Update team level if changed
  IF v_new_level != v_current_level THEN
    UPDATE teams
    SET wow_level = v_new_level,
        wow_level_updated_at = NOW()
    WHERE id = p_team_id;
  END IF;

  RETURN jsonb_build_object(
    'level', v_new_level,
    'previous_level', v_current_level,
    'level_changed', v_new_level != v_current_level,
    'risk', jsonb_build_object('state', v_risk_state, 'reason', v_risk_reason),
    'progress', jsonb_build_object(
      'sessions_30d', v_sessions_30d,
      'sessions_45d', v_sessions_45d,
      'sessions_total', v_sessions_total,
      'unique_angles', v_unique_angles,
      'followups_count', v_followups,
      'last_2_avg_score', v_last_2_avg,
      'last_3_avg_score', v_last_3_avg,
      'days_since_last_session', v_days_since,
      'can_unlock_ha', v_can_ha,
      'can_unlock_ri', v_can_ri
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Drop old function
DROP FUNCTION IF EXISTS evaluate_ceremony_level(UUID);
