-- Coach insights cache: store AI-generated coaching insights per team
-- Used by Agile Coach and Transition Coach tiers only

CREATE TABLE IF NOT EXISTS coach_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  data_hash TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('agile_coach', 'transition_coach')),
  content JSONB NOT NULL,
  generation_count INTEGER NOT NULL DEFAULT 1,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, data_hash, tier)
);

CREATE INDEX IF NOT EXISTS idx_coach_insights_team ON coach_insights(team_id);
CREATE INDEX IF NOT EXISTS idx_coach_insights_generated ON coach_insights(generated_at);

-- Daily generation counter: count generations per team today
CREATE OR REPLACE FUNCTION get_daily_generation_count(p_team_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(COUNT(*), 0)::INTEGER
  FROM coach_insights
  WHERE team_id = p_team_id
    AND generated_at >= CURRENT_DATE
    AND generated_at < CURRENT_DATE + INTERVAL '1 day';
$$ LANGUAGE sql STABLE;
