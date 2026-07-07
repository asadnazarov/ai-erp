-- Run in Supabase SQL Editor after previous migrations.
-- CRM upgrade: Pipeline (rejection reasons), fuller lead cards, project<->lead linking,
-- KP (proposal) generation, task assignees, client-scoped documents, immutability for
-- leads (no delete) and comments (no edit/delete).

-- =========================================================
-- 1. LEADS — fuller card + pipeline
-- =========================================================
alter table leads add column if not exists employees_count int;
alter table leads add column if not exists budget text;
alter table leads add column if not exists form_data jsonb default '{}';
alter table leads add column if not exists submitted_at timestamptz default now();
alter table leads add column if not exists pipeline_stage text
  check (pipeline_stage in ('qimmat','qiziqdi','qaror_qabul_qiluvchi_emas','boshqa'));
alter table leads add column if not exists rejection_note text;

-- =========================================================
-- 2. PROJECTS — link to lead + client contact + KP fields
-- =========================================================
alter table projects add column if not exists lead_id uuid references leads(id) on delete set null;
alter table projects add column if not exists client_contact_name text;
alter table projects add column if not exists employees_count int;
alter table projects add column if not exists budget text;
alter table projects add column if not exists tz_file_url text;

-- =========================================================
-- 3. PROPOSALS (KP — commercial proposal generation)
-- =========================================================
create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  payment_type text check (payment_type in ('bir_martalik','bolib_tolash')),
  installments_count int,
  support_tier text check (support_tier in ('bepul','start','pro','max')),
  support_months int,
  generated_html text,
  created_at timestamptz default now()
);
alter table proposals enable row level security;
drop policy if exists "public_all" on proposals;
create policy "public_all" on proposals for all to public using (true) with check (true);

-- =========================================================
-- 4. TASKS — assignee
-- =========================================================
alter table tasks add column if not exists assignee_id uuid references profiles(id);

-- =========================================================
-- 5. DOCUMENTS — client-scoped docs + spend notes
-- =========================================================
alter table documents add column if not exists client_id uuid references clients(id) on delete cascade;
alter table documents add column if not exists spend_notes text;

-- =========================================================
-- 6. IMMUTABILITY — leads can't be deleted, comments can't be edited/deleted
-- =========================================================
drop policy if exists "public_all" on leads;
create policy "public_select_leads" on leads for select to public using (true);
create policy "public_insert_leads" on leads for insert to public with check (true);
create policy "public_update_leads" on leads for update to public using (true) with check (true);
-- no delete policy => deletes are rejected by RLS

drop policy if exists "public_all" on comments;
create policy "public_select_comments" on comments for select to public using (true);
create policy "public_insert_comments" on comments for insert to public with check (true);
-- no update/delete policy => comments are permanent
