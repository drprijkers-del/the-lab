-- Add clerk_user_id column to admin_users for Clerk auth integration
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE;

-- Index for fast lookups by clerk_user_id
CREATE INDEX IF NOT EXISTS idx_admin_users_clerk_user_id ON admin_users(clerk_user_id);
