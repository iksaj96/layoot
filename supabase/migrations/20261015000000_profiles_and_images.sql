-- Run this migration in the Supabase SQL Editor or with Supabase CLI.
-- It backfills profiles from auth.users and image metadata from the existing bucket.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Layoot users can read their profile" on public.profiles;
create policy "Layoot users can read their profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "Layoot users can update their profile" on public.profiles;
create policy "Layoot users can update their profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

grant select, update on public.profiles to authenticated;

create or replace function public.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles as current_profile (
    id, email, full_name, avatar_url, created_at, updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), '')
    ),
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    coalesce(new.created_at, now()),
    now()
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(
        nullif(new.raw_user_meta_data ->> 'full_name', ''),
        nullif(new.raw_user_meta_data ->> 'name', ''),
        current_profile.full_name
      ),
      avatar_url = coalesce(excluded.avatar_url, current_profile.avatar_url),
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists layoot_sync_profile_from_auth_user on auth.users;
create trigger layoot_sync_profile_from_auth_user
  after insert or update on auth.users
  for each row execute function public.sync_profile_from_auth_user();

insert into public.profiles as current_profile (
  id, email, full_name, avatar_url, created_at, updated_at
)
select
  users.id,
  users.email,
  coalesce(
    nullif(users.raw_user_meta_data ->> 'full_name', ''),
    nullif(users.raw_user_meta_data ->> 'name', ''),
    nullif(split_part(coalesce(users.email, ''), '@', 1), '')
  ),
  nullif(users.raw_user_meta_data ->> 'avatar_url', ''),
  coalesce(users.created_at, now()),
  coalesce(users.updated_at, now())
from auth.users as users
on conflict (id) do update
set email = excluded.email,
    full_name = coalesce(excluded.full_name, current_profile.full_name),
    avatar_url = coalesce(excluded.avatar_url, current_profile.avatar_url),
    updated_at = greatest(current_profile.updated_at, excluded.updated_at);

create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text,
  size_bytes bigint,
  width integer,
  height integer,
  created_at timestamptz not null default now(),
  constraint images_size_nonnegative check (size_bytes is null or size_bytes >= 0),
  constraint images_dimensions_positive check (
    (width is null or width > 0) and (height is null or height > 0)
  ),
  constraint images_path_owned_by_user check (
    split_part(storage_path, '/', 1) = user_id::text
    and split_part(storage_path, '/', 2) <> ''
    and split_part(storage_path, '/', 3) = ''
  )
);

create index if not exists images_user_created_at_idx
  on public.images (user_id, created_at desc);

alter table public.images enable row level security;

drop policy if exists "Layoot users can read their images" on public.images;
create policy "Layoot users can read their images"
  on public.images for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Layoot users can add their images" on public.images;
create policy "Layoot users can add their images"
  on public.images for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and split_part(storage_path, '/', 1) = (select auth.uid())::text
  );

drop policy if exists "Layoot users can delete their images" on public.images;
create policy "Layoot users can delete their images"
  on public.images for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, delete on public.images to authenticated;

insert into storage.buckets (id, name, public)
values ('design-assets', 'design-assets', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Layoot users can read their design assets" on storage.objects;
create policy "Layoot users can read their design assets"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'design-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Layoot users can upload their design assets" on storage.objects;
create policy "Layoot users can upload their design assets"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'design-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Layoot users can delete their design assets" on storage.objects;
create policy "Layoot users can delete their design assets"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'design-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

insert into public.images as current_image (
  user_id, storage_path, file_name, mime_type, size_bytes, width, height
)
select
  profiles.id,
  objects.name,
  split_part(objects.name, '/', 2),
  nullif(objects.metadata ->> 'mimetype', ''),
  case
    when objects.metadata ->> 'size' ~ '^[0-9]+$'
      then (objects.metadata ->> 'size')::bigint
    else null
  end,
  case
    when objects.metadata ->> 'width' ~ '^[1-9][0-9]*$'
      then (objects.metadata ->> 'width')::integer
    else null
  end,
  case
    when objects.metadata ->> 'height' ~ '^[1-9][0-9]*$'
      then (objects.metadata ->> 'height')::integer
    else null
  end
from storage.objects as objects
join public.profiles as profiles
  on profiles.id::text = split_part(objects.name, '/', 1)
where objects.bucket_id = 'design-assets'
  and split_part(objects.name, '/', 1) ~
    '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  and split_part(objects.name, '/', 2) <> ''
  and split_part(objects.name, '/', 3) = ''
on conflict (storage_path) do update
set user_id = excluded.user_id,
    file_name = excluded.file_name,
    mime_type = coalesce(excluded.mime_type, current_image.mime_type),
    size_bytes = coalesce(excluded.size_bytes, current_image.size_bytes),
    width = coalesce(excluded.width, current_image.width),
    height = coalesce(excluded.height, current_image.height);
