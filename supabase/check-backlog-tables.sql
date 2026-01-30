-- Run this in Supabase SQL Editor to check if backlog tables exist
-- and see any existing data

-- Check if tables exist
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('backlog_items', 'release_notes');

-- Check if types exist
SELECT
  typname
FROM pg_type
WHERE typname IN ('product_type', 'backlog_category', 'backlog_status', 'backlog_decision');

-- Count items in tables (if they exist)
SELECT 'backlog_items' as table_name, COUNT(*) as count FROM backlog_items
UNION ALL
SELECT 'release_notes' as table_name, COUNT(*) as count FROM release_notes;

-- Show all backlog items (if any)
SELECT id, product, category, status, title_en, created_at
FROM backlog_items
ORDER BY created_at DESC
LIMIT 10;
