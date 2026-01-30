-- ============================================================================
-- BACKLOG ITEMS & RELEASE NOTES
-- Run this in Supabase SQL Editor if tables don't exist
-- ============================================================================

-- Create types if they don't exist
DO $$ BEGIN
  CREATE TYPE product_type AS ENUM ('delta', 'pulse', 'shared');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE backlog_category AS ENUM ('ux', 'statements', 'analytics', 'integration', 'features');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE backlog_status AS ENUM ('review', 'exploring', 'decided');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE backlog_decision AS ENUM ('building', 'not_doing');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create update_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Backlog items table
CREATE TABLE IF NOT EXISTS backlog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product product_type NOT NULL DEFAULT 'delta',
  category backlog_category NOT NULL,
  status backlog_status NOT NULL DEFAULT 'review',
  decision backlog_decision,

  -- Multilingual content
  title_nl TEXT NOT NULL,
  title_en TEXT NOT NULL,
  source_nl TEXT NOT NULL,
  source_en TEXT NOT NULL,
  our_take_nl TEXT NOT NULL,
  our_take_en TEXT NOT NULL,
  rationale_nl TEXT,
  rationale_en TEXT,

  -- Dates
  reviewed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  decided_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Release notes table
CREATE TABLE IF NOT EXISTS release_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product product_type NOT NULL DEFAULT 'delta',
  version TEXT NOT NULL,

  -- Multilingual content
  title_nl TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_nl TEXT NOT NULL,
  description_en TEXT NOT NULL,

  -- What changed
  changes JSONB NOT NULL DEFAULT '[]',

  -- Dates
  released_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_backlog_items_product ON backlog_items(product);
CREATE INDEX IF NOT EXISTS idx_backlog_items_status ON backlog_items(status);
CREATE INDEX IF NOT EXISTS idx_backlog_items_category ON backlog_items(category);
CREATE INDEX IF NOT EXISTS idx_release_notes_product ON release_notes(product);
CREATE INDEX IF NOT EXISTS idx_release_notes_released_at ON release_notes(released_at DESC);

-- Enable RLS
ALTER TABLE backlog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE release_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate cleanly)
DROP POLICY IF EXISTS "backlog_items_public_read" ON backlog_items;
DROP POLICY IF EXISTS "release_notes_public_read" ON release_notes;

-- RLS Policies - PUBLIC READ FOR EVERYONE
CREATE POLICY "backlog_items_public_read" ON backlog_items
  FOR SELECT
  USING (true);

CREATE POLICY "release_notes_public_read" ON release_notes
  FOR SELECT
  USING (true);

-- Grant permissions to anon for reading
GRANT SELECT ON backlog_items TO anon;
GRANT SELECT ON release_notes TO anon;

-- Grant all to authenticated (for service role access)
GRANT ALL ON backlog_items TO authenticated;
GRANT ALL ON release_notes TO authenticated;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_backlog_items_updated_at ON backlog_items;
CREATE TRIGGER update_backlog_items_updated_at
  BEFORE UPDATE ON backlog_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_release_notes_updated_at ON release_notes;
CREATE TRIGGER update_release_notes_updated_at
  BEFORE UPDATE ON release_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert a test item to verify it works
INSERT INTO backlog_items (product, category, status, title_nl, title_en, source_nl, source_en, our_take_nl, our_take_en)
VALUES (
  'delta',
  'features',
  'review',
  'Test item (verwijder mij)',
  'Test item (delete me)',
  'Handmatig toegevoegd',
  'Manually added',
  'Dit is een test item om te verifiëren dat de database werkt.',
  'This is a test item to verify the database works.'
);

-- Show the inserted item
SELECT id, product, category, status, title_en, created_at FROM backlog_items;
