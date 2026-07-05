-- Run in Supabase SQL Editor after migration_remove_login.sql

-- Generic comments, attachable to any entity (projects, tasks, leads, clients, contracts, demo_requests)
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  author_name text default 'Jamoa a''zosi',
  body text not null,
  created_at timestamptz default now()
);
create index if not exists comments_entity_idx on comments(entity_type, entity_id);

-- Payment stages (installments) linked to a contract
create table if not exists payment_stages (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid references contracts(id) on delete cascade,
  title text not null,
  amount numeric not null,
  due_date date,
  status text default 'kutilmoqda' check (status in ('kutilmoqda','tolandi','kechikdi')),
  paid_at date,
  created_at timestamptz default now()
);

alter table comments enable row level security;
drop policy if exists "public_all" on comments;
create policy "public_all" on comments for all to public using (true) with check (true);

alter table payment_stages enable row level security;
drop policy if exists "public_all" on payment_stages;
create policy "public_all" on payment_stages for all to public using (true) with check (true);
