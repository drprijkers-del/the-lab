-- Add unique constraints on Mollie IDs to prevent duplicates from webhook retries

-- Unique Mollie customer per admin user
CREATE UNIQUE INDEX IF NOT EXISTS uq_admin_mollie_customer
  ON admin_users (mollie_customer_id)
  WHERE mollie_customer_id IS NOT NULL;

-- Unique Mollie subscription per admin user
CREATE UNIQUE INDEX IF NOT EXISTS uq_admin_mollie_subscription
  ON admin_users (mollie_subscription_id)
  WHERE mollie_subscription_id IS NOT NULL;

-- Unique Mollie payment ID (enforce upsert correctness)
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_mollie_id
  ON payments (mollie_payment_id)
  WHERE mollie_payment_id IS NOT NULL;
