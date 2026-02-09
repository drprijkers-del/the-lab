-- Account-level billing: move subscription from teams to admin_users
-- Tiers: free (1 team), scrum_master (3), agile_coach (10), transition_coach (25)

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free'
  CHECK (subscription_tier IN ('free', 'scrum_master', 'agile_coach', 'transition_coach'));
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS mollie_customer_id TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS mollie_subscription_id TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS billing_status TEXT NOT NULL DEFAULT 'none'
  CHECK (billing_status IN ('none', 'pending_mandate', 'active', 'cancelled', 'past_due'));
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS billing_period_end TIMESTAMPTZ;

-- Allow payments to link to admin_user instead of team
ALTER TABLE payments ADD COLUMN IF NOT EXISTS admin_user_id UUID REFERENCES admin_users(id);
ALTER TABLE payments ALTER COLUMN team_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_admin_user_id ON payments(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_billing ON admin_users(subscription_tier, billing_status);

-- Migrate existing per-team Pro subscribers to account-level
-- Transfer mollie_customer_id from team to owner's admin_users row
UPDATE admin_users au
SET
  mollie_customer_id = t.mollie_customer_id,
  mollie_subscription_id = t.mollie_subscription_id,
  billing_status = t.billing_status,
  billing_period_end = t.billing_period_end,
  subscription_tier = 'scrum_master'
FROM teams t
WHERE t.owner_id = au.id
  AND t.plan = 'pro'
  AND t.billing_status IN ('active', 'cancelled')
  AND t.mollie_customer_id IS NOT NULL;
