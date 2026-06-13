-- PixelForge Full-Stack Studio Foundation
-- Migration: 20260614001000_full_stack_studio
-- Adds: projects, brand_kits, creative_briefs, assets, export_jobs
-- Extends: generations with project/brief/brand_kit/parent/version_number
--
-- Policy pattern: DROP IF EXISTS before CREATE for idempotency.
-- service_role policies omitted — service_role bypasses RLS by default.
-- RLS uses (SELECT auth.uid())::text to evaluate uid once per query, not per row.

-- ─── PROJECTS ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.projects (
  id          text        PRIMARY KEY DEFAULT (gen_random_uuid()::text),
  name        text        NOT NULL,
  description text,
  user_id     text        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projects_user_id_idx ON public.projects (user_id);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_own" ON public.projects;
CREATE POLICY "projects_select_own" ON public.projects FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "projects_insert_own" ON public.projects;
CREATE POLICY "projects_insert_own" ON public.projects FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "projects_update_own" ON public.projects;
CREATE POLICY "projects_update_own" ON public.projects FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "projects_delete_own" ON public.projects;
CREATE POLICY "projects_delete_own" ON public.projects FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid())::text);

-- ─── BRAND KITS ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.brand_kits (
  id         text        PRIMARY KEY DEFAULT (gen_random_uuid()::text),
  name       text        NOT NULL,
  colors     jsonb       NOT NULL DEFAULT '[]'::jsonb,
  fonts      jsonb       NOT NULL DEFAULT '[]'::jsonb,
  logo_url   text,
  user_id    text        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS brand_kits_user_id_idx ON public.brand_kits (user_id);

ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brand_kits_select_own" ON public.brand_kits;
CREATE POLICY "brand_kits_select_own" ON public.brand_kits FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "brand_kits_insert_own" ON public.brand_kits;
CREATE POLICY "brand_kits_insert_own" ON public.brand_kits FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "brand_kits_update_own" ON public.brand_kits;
CREATE POLICY "brand_kits_update_own" ON public.brand_kits FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "brand_kits_delete_own" ON public.brand_kits;
CREATE POLICY "brand_kits_delete_own" ON public.brand_kits FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid())::text);

-- ─── CREATIVE BRIEFS ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.creative_briefs (
  id          text        PRIMARY KEY DEFAULT (gen_random_uuid()::text),
  title       text        NOT NULL,
  description text,
  project_id  text        REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id     text        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS creative_briefs_user_id_idx    ON public.creative_briefs (user_id);
CREATE INDEX IF NOT EXISTS creative_briefs_project_id_idx ON public.creative_briefs (project_id);

ALTER TABLE public.creative_briefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "creative_briefs_select_own" ON public.creative_briefs;
CREATE POLICY "creative_briefs_select_own" ON public.creative_briefs FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "creative_briefs_insert_own" ON public.creative_briefs;
CREATE POLICY "creative_briefs_insert_own" ON public.creative_briefs FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "creative_briefs_update_own" ON public.creative_briefs;
CREATE POLICY "creative_briefs_update_own" ON public.creative_briefs FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "creative_briefs_delete_own" ON public.creative_briefs;
CREATE POLICY "creative_briefs_delete_own" ON public.creative_briefs FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid())::text);

-- ─── ASSETS ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.assets (
  id            text        PRIMARY KEY DEFAULT (gen_random_uuid()::text),
  name          text        NOT NULL,
  url           text        NOT NULL,
  type          text        NOT NULL,
  metadata      jsonb       NOT NULL DEFAULT '{}'::jsonb,
  project_id    text        REFERENCES public.projects(id) ON DELETE SET NULL,
  generation_id text        REFERENCES public.generations(id) ON DELETE SET NULL,
  user_id       text        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assets_user_id_idx       ON public.assets (user_id);
CREATE INDEX IF NOT EXISTS assets_project_id_idx    ON public.assets (project_id);
CREATE INDEX IF NOT EXISTS assets_generation_id_idx ON public.assets (generation_id);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assets_select_own" ON public.assets;
CREATE POLICY "assets_select_own" ON public.assets FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "assets_insert_own" ON public.assets;
CREATE POLICY "assets_insert_own" ON public.assets FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "assets_update_own" ON public.assets;
CREATE POLICY "assets_update_own" ON public.assets FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "assets_delete_own" ON public.assets;
CREATE POLICY "assets_delete_own" ON public.assets FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid())::text);

-- ─── EXPORT JOBS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.export_jobs (
  id            text        PRIMARY KEY DEFAULT (gen_random_uuid()::text),
  status        text        NOT NULL DEFAULT 'PENDING',
  format        text        NOT NULL,
  output_url    text,
  error         text,
  generation_id text        REFERENCES public.generations(id) ON DELETE SET NULL,
  project_id    text        REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id       text        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS export_jobs_user_id_idx       ON public.export_jobs (user_id);
CREATE INDEX IF NOT EXISTS export_jobs_generation_id_idx ON public.export_jobs (generation_id);
CREATE INDEX IF NOT EXISTS export_jobs_project_id_idx    ON public.export_jobs (project_id);
CREATE INDEX IF NOT EXISTS export_jobs_status_idx        ON public.export_jobs (status);

ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "export_jobs_select_own" ON public.export_jobs;
CREATE POLICY "export_jobs_select_own" ON public.export_jobs FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "export_jobs_insert_own" ON public.export_jobs;
CREATE POLICY "export_jobs_insert_own" ON public.export_jobs FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "export_jobs_update_own" ON public.export_jobs;
CREATE POLICY "export_jobs_update_own" ON public.export_jobs FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "export_jobs_delete_own" ON public.export_jobs;
CREATE POLICY "export_jobs_delete_own" ON public.export_jobs FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid())::text);

-- ─── EXTEND GENERATIONS ──────────────────────────────────────────────────────

ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS project_id    text REFERENCES public.projects(id)        ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS brief_id      text REFERENCES public.creative_briefs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS brand_kit_id  text REFERENCES public.brand_kits(id)      ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS parent_id     text REFERENCES public.generations(id)     ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS version_number integer NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS generations_project_id_idx   ON public.generations (project_id);
CREATE INDEX IF NOT EXISTS generations_brief_id_idx     ON public.generations (brief_id);
CREATE INDEX IF NOT EXISTS generations_brand_kit_id_idx ON public.generations (brand_kit_id);
CREATE INDEX IF NOT EXISTS generations_parent_id_idx    ON public.generations (parent_id);
