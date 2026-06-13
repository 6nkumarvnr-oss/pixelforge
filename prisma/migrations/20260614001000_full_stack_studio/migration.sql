-- PixelForge full-stack AI Creative Production Studio foundation.
-- Apply only after human approval and a Supabase backup/checkpoint.

create extension if not exists pgcrypto;

create table if not exists projects (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  description text not null default '',
  category text not null default 'Creative',
  status text not null default 'ACTIVE',
  owner_id text not null references users(id) on delete cascade,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists brand_kits (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  description text not null default '',
  colors jsonb not null default '[]'::jsonb,
  logos jsonb not null default '[]'::jsonb,
  voice text not null default '',
  rules jsonb not null default '{}'::jsonb,
  owner_id text not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists creative_briefs (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  objective text not null default '',
  audience text not null default '',
  channel text not null default 'General',
  status text not null default 'DRAFT',
  prompt text not null default '',
  negative text not null default '',
  style_guide jsonb not null default '{}'::jsonb,
  owner_id text not null references users(id) on delete cascade,
  project_id text references projects(id) on delete set null,
  brand_kit_id text references brand_kits(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table generations add column if not exists project_id text references projects(id) on delete set null;
alter table generations add column if not exists brief_id text references creative_briefs(id) on delete set null;
alter table generations add column if not exists brand_kit_id text references brand_kits(id) on delete set null;
alter table generations add column if not exists parent_id text references generations(id) on delete set null;
alter table generations add column if not exists version_number integer not null default 1;

create table if not exists assets (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  kind text not null default 'IMAGE',
  url text not null,
  thumbnail_url text,
  tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  owner_id text not null references users(id) on delete cascade,
  project_id text references projects(id) on delete set null,
  brief_id text references creative_briefs(id) on delete set null,
  brand_kit_id text references brand_kits(id) on delete set null,
  generation_id text references generations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists export_jobs (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  format text not null default 'PNG',
  status text not null default 'READY',
  payload jsonb not null default '{}'::jsonb,
  owner_id text not null references users(id) on delete cascade,
  project_id text references projects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_owner_id_updated_at_idx on projects(owner_id, updated_at desc);
create index if not exists projects_status_idx on projects(status);
create index if not exists brand_kits_owner_id_updated_at_idx on brand_kits(owner_id, updated_at desc);
create index if not exists creative_briefs_owner_id_updated_at_idx on creative_briefs(owner_id, updated_at desc);
create index if not exists creative_briefs_project_id_idx on creative_briefs(project_id);
create index if not exists creative_briefs_brand_kit_id_idx on creative_briefs(brand_kit_id);
create index if not exists creative_briefs_status_idx on creative_briefs(status);
create index if not exists generations_project_id_created_at_idx on generations(project_id, created_at desc);
create index if not exists generations_brief_id_idx on generations(brief_id);
create index if not exists generations_brand_kit_id_idx on generations(brand_kit_id);
create index if not exists generations_parent_id_idx on generations(parent_id);
create index if not exists assets_owner_id_updated_at_idx on assets(owner_id, updated_at desc);
create index if not exists assets_project_id_idx on assets(project_id);
create index if not exists assets_brief_id_idx on assets(brief_id);
create index if not exists assets_generation_id_idx on assets(generation_id);
create index if not exists export_jobs_owner_id_updated_at_idx on export_jobs(owner_id, updated_at desc);
create index if not exists export_jobs_project_id_idx on export_jobs(project_id);
create index if not exists export_jobs_status_idx on export_jobs(status);
