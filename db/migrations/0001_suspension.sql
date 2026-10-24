-- Suspension de compte (administration)
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at timestamptz;
