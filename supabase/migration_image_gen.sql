-- Run in Supabase SQL Editor after previous migrations

create table if not exists generated_images (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  width int not null default 1024,
  height int not null default 1024,
  image_url text not null,
  created_at timestamptz default now()
);

alter table generated_images enable row level security;
drop policy if exists "public_all" on generated_images;
create policy "public_all" on generated_images for all to public using (true) with check (true);
