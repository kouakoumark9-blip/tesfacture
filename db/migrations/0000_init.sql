-- TesFacture — schéma initial (Prompt 1)
-- Appliqué automatiquement au démarrage par db/client.ts

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  email text,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  plan text NOT NULL DEFAULT 'free',
  plan_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name text,
  logo text,
  rccm text,
  tax_number text,
  address text,
  phone text,
  payment_numbers jsonb NOT NULL DEFAULT '{}'::jsonb,
  default_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS clients_user_idx ON clients (user_id);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  type text NOT NULL,
  number text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  issue_date text NOT NULL,
  due_date text,
  discount_percent numeric(5,2) NOT NULL DEFAULT 0,
  vat_percent numeric(5,2) NOT NULL DEFAULT 0,
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  discount_amount numeric(14,2) NOT NULL DEFAULT 0,
  vat_amount numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  note text,
  payment_methods jsonb NOT NULL DEFAULT '[]'::jsonb,
  delivery_address text,
  delivered_by text,
  source_document_id uuid,
  share_token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT documents_user_number_unique UNIQUE (user_id, number)
);
CREATE INDEX IF NOT EXISTS documents_user_idx ON documents (user_id);

CREATE TABLE IF NOT EXISTS document_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  description text NOT NULL,
  quantity numeric(12,2) NOT NULL DEFAULT 1,
  unit_price numeric(14,2) NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS document_items_document_idx ON document_items (document_id);

CREATE TABLE IF NOT EXISTS installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  label text NOT NULL,
  amount numeric(14,2) NOT NULL,
  due_date text,
  paid_at timestamptz,
  method text
);
CREATE INDEX IF NOT EXISTS installments_document_idx ON installments (document_id);

CREATE TABLE IF NOT EXISTS payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan text NOT NULL,
  amount numeric(14,2) NOT NULL,
  reference text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  validated_at timestamptz
);
CREATE INDEX IF NOT EXISTS payment_requests_user_idx ON payment_requests (user_id);

CREATE TABLE IF NOT EXISTS counters (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  year integer NOT NULL,
  last_number integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, type, year)
);

CREATE TABLE IF NOT EXISTS admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_user_id uuid,
  target_id text,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_actions_admin_idx ON admin_actions (admin_id);
