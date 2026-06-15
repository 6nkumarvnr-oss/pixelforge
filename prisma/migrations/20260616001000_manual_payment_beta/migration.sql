-- PixelForge Manual Payment Beta SaaS Protocol
-- Migration: 20260616001000_manual_payment_beta
-- Adds manual payment fields, manual payment records, and admin audit logs.
-- No Stripe live-mode activation. No paid provider activation.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'FREE',
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS expiry_date timestamptz,
  ADD COLUMN IF NOT EXISTS activated_by_admin text,
  ADD COLUMN IF NOT EXISTS activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS deactivated_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_notes text;

CREATE INDEX IF NOT EXISTS users_payment_status_idx ON public.users (payment_status);
CREATE INDEX IF NOT EXISTS users_expiry_date_idx ON public.users (expiry_date);

CREATE TABLE IF NOT EXISTS public.manual_payment_records (
  id text PRIMARY KEY DEFAULT (gen_random_uuid()::text),
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  customer_email text NOT NULL,
  customer_name text,
  selected_plan text NOT NULL,
  amount numeric(12, 2),
  currency text NOT NULL DEFAULT 'USD',
  payment_method text NOT NULL DEFAULT 'UPI',
  payment_reference text,
  invoice_number text,
  receipt_file_url text,
  receipt_file_storage_path text,
  receipt_file_name text,
  payment_status text NOT NULL DEFAULT 'PENDING_RECEIPT',
  admin_verification_status text NOT NULL DEFAULT 'PENDING',
  verified_by_admin text,
  verified_at timestamptz,
  rejection_reason text,
  activated_plan text,
  credits_granted integer,
  valid_from timestamptz,
  valid_until timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS manual_payment_records_user_id_idx ON public.manual_payment_records (user_id);
CREATE INDEX IF NOT EXISTS manual_payment_records_payment_status_idx ON public.manual_payment_records (payment_status);
CREATE INDEX IF NOT EXISTS manual_payment_records_admin_verification_status_idx ON public.manual_payment_records (admin_verification_status);
CREATE INDEX IF NOT EXISTS manual_payment_records_created_at_idx ON public.manual_payment_records (created_at);

ALTER TABLE public.manual_payment_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "manual_payment_records_select_own" ON public.manual_payment_records;
CREATE POLICY "manual_payment_records_select_own" ON public.manual_payment_records FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "manual_payment_records_insert_own" ON public.manual_payment_records;
CREATE POLICY "manual_payment_records_insert_own" ON public.manual_payment_records FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id text PRIMARY KEY DEFAULT (gen_random_uuid()::text),
  admin_user_id text NOT NULL,
  target_user_id text NOT NULL,
  action_type text NOT NULL,
  previous_status text,
  new_status text,
  previous_plan text,
  new_plan text,
  previous_expiry_date timestamptz,
  new_expiry_date timestamptz,
  payment_record_id text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_logs_admin_user_id_idx ON public.admin_audit_logs (admin_user_id);
CREATE INDEX IF NOT EXISTS admin_audit_logs_target_user_id_idx ON public.admin_audit_logs (target_user_id);
CREATE INDEX IF NOT EXISTS admin_audit_logs_payment_record_id_idx ON public.admin_audit_logs (payment_record_id);
CREATE INDEX IF NOT EXISTS admin_audit_logs_created_at_idx ON public.admin_audit_logs (created_at);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- No authenticated user policy is created for admin_audit_logs.
-- Admin audit logs are accessed only through server-side super-admin routes.
