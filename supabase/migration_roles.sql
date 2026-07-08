-- Run in Supabase SQL Editor after migration_fixes1.sql
-- Reintroduces mandatory login with roles: 'full' (CEO/SEO — sees everything),
-- 'crm' (external lead-quality reviewer — sees only CRM/leads), 'pending' (just
-- registered, no role assigned yet — sees nothing until a 'full' user promotes them).

alter table profiles add column if not exists role text check (role in ('full','crm','pending')) default 'pending';

-- security-definer helper avoids "infinite recursion detected in policy" when a
-- profiles policy needs to check the caller's own role (querying profiles from
-- inside a profiles policy would otherwise re-trigger RLS on itself).
create or replace function public.is_full_role() returns boolean
language sql security definer stable
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'full');
$$;

-- =========================================================
-- PROFILES — anyone logged in can read (needed for assignee pickers etc.);
-- a user can only insert their own row as 'pending'; only 'full' can update
-- (i.e. assign roles, edit others' org-chart info).
-- =========================================================
drop policy if exists "public_all" on profiles;
drop policy if exists "insert_own_profile" on profiles;
create policy "profiles_select" on profiles for select to authenticated using (true);
create policy "profiles_insert_self" on profiles for insert to authenticated with check (id = auth.uid() and role = 'pending');
create policy "profiles_update_full" on profiles for update to authenticated using (is_full_role()) with check (is_full_role());

-- =========================================================
-- LEADS / COMMENTS — visible to any logged-in user (both 'full' and 'crm'
-- need to work the CRM); leads insert stays public for n8n/external forms.
-- =========================================================
drop policy if exists "public_select_leads" on leads;
drop policy if exists "public_update_leads" on leads;
create policy "leads_select_auth" on leads for select to authenticated using (true);
create policy "leads_update_auth" on leads for update to authenticated using (true) with check (true);
-- "public_insert_leads" (insert, public) is left untouched — n8n/webhooks keep working.

drop policy if exists "public_select_comments" on comments;
create policy "comments_select_auth" on comments for select to authenticated using (
  entity_type = 'lead' or is_full_role()
);
drop policy if exists "public_insert_comments" on comments;
create policy "comments_insert_auth" on comments for insert to authenticated with check (
  entity_type = 'lead' or is_full_role()
);

-- =========================================================
-- EVERYTHING ELSE — 'full' role only.
-- =========================================================
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'clients','client_interactions','projects','project_logs','tasks','documents',
    'finance_transactions','finance_goals','contracts','demo_requests',
    'payment_stages','proposals','generated_images'
  ])
  loop
    execute format('drop policy if exists "public_all" on %I;', t);
    execute format(
      'create policy "full_role_all" on %I for all to authenticated using (is_full_role()) with check (is_full_role());', t
    );
  end loop;
end $$;

-- =========================================================
-- STORAGE — reads stay public (direct file links); writes require 'full' role.
-- =========================================================
drop policy if exists "attachments_write" on storage.objects;
create policy "attachments_write" on storage.objects for insert to authenticated with check (bucket_id = 'attachments' and is_full_role());

drop policy if exists "attachments_update" on storage.objects;
create policy "attachments_update" on storage.objects for update to authenticated using (bucket_id = 'attachments' and is_full_role());

drop policy if exists "attachments_delete" on storage.objects;
create policy "attachments_delete" on storage.objects for delete to authenticated using (bucket_id = 'attachments' and is_full_role());
