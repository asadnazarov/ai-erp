-- Run in Supabase SQL Editor after migration_crm.sql

-- Finance: track edits on transactions
alter table finance_transactions add column if not exists edited_at timestamptz;

-- Projects: persistent payment terms (separate from KP generation form)
alter table projects add column if not exists payment_type text check (payment_type in ('bir_martalik','bolib_tolash'));
alter table projects add column if not exists installments_count int;

-- Proposals: distinguish KP vs standalone support-terms documents
alter table proposals add column if not exists kind text check (kind in ('kp','support')) default 'kp';
