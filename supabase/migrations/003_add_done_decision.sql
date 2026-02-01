-- ============================================
-- ADD 'done' TO BACKLOG DECISION ENUM
-- Run this in Supabase SQL Editor
-- ============================================

-- Add 'done' value to the backlog_decision enum
ALTER TYPE backlog_decision ADD VALUE IF NOT EXISTS 'done';

-- Verify the change
SELECT enum_range(NULL::backlog_decision);
