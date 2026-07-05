-- Run this in Supabase SQL Editor to remove the login requirement.
-- Safe to run even if some parts were already applied.

-- 1. profiles.id no longer needs to reference auth.users (no signup flow anymore)
alter table profiles drop constraint if exists profiles_id_fkey;
alter table profiles alter column id set default gen_random_uuid();

-- 2. open up all table policies to public (anon key), removing the "must be logged in" restriction
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'profiles','clients','client_interactions','leads','projects','project_logs',
    'tasks','documents','finance_transactions','finance_goals','contracts','demo_requests'
  ])
  loop
    execute format('drop policy if exists "authenticated_all" on %I;', t);
    execute format('drop policy if exists "public_all" on %I;', t);
    execute format(
      'create policy "public_all" on %I for all to public using (true) with check (true);', t
    );
  end loop;
end $$;

drop policy if exists "insert_own_profile" on profiles;

-- 3. open up storage (file uploads) to public as well
drop policy if exists "attachments_write" on storage.objects;
create policy "attachments_write" on storage.objects for insert to public with check (bucket_id = 'attachments');

drop policy if exists "attachments_update" on storage.objects;
create policy "attachments_update" on storage.objects for update to public using (bucket_id = 'attachments');

drop policy if exists "attachments_delete" on storage.objects;
create policy "attachments_delete" on storage.objects for delete to public using (bucket_id = 'attachments');
