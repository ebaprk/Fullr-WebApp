-- Fullr web schema: business-owner registrations create a Users profile and
-- a linked store. This repository does not create or manage mobile/student
-- profiles; run this in the Supabase SQL Editor.

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'StoreType' and n.nspname = 'public'
  ) then
    create type public."StoreType" as enum ('Pantry', 'Business', 'Campus', 'Restaurant');
  end if;
end;
$$;

-- Users contains business-owner profiles only. A row is created for the web
-- registration flow, and Stores.owner_id points at that business owner.
create table if not exists public."Users" (
  id uuid primary key references auth.users (id) on delete cascade,
  registered_at timestamptz not null default now(),
  name text,
  image text
);

create table if not exists public."Stores" (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public."Users" (id) on delete cascade,
  registered_at timestamptz not null default now(),
  name text not null,
  address text,
  description text,
  store_type public."StoreType",
  image text
);

-- Migration from the original one-store-per-auth-user schema. Legacy store
-- IDs remain valid store IDs, and their prior value becomes owner_id.
alter table public."Stores" add column if not exists owner_id uuid;

-- These fields are optional in the web registration form. Drop constraints
-- left over from an earlier version of the deployed Stores table.
alter table public."Stores" alter column address drop not null;
alter table public."Stores" alter column description drop not null;
alter table public."Stores" alter column image drop not null;

-- A legacy store used its auth user ID as the store ID. Preserve it as the
-- owner when its auth account still exists.
update public."Stores" as s
set owner_id = s.id
where s.owner_id is null
  and exists (
    select 1 from auth.users as u where u.id = s.id
  );

-- Backfill business-owner profiles only for existing store owners and web
-- accounts. Other account types do not receive a Users profile here.
insert into public."Users" (id, name, image)
select
  u.id,
  coalesce(
    u.raw_user_meta_data->>'name',
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'store_name',
    u.raw_user_meta_data->>'business_name'
  ),
  u.raw_user_meta_data->>'image'
from auth.users as u
where u.raw_user_meta_data->>'account_type' = 'store'
   or exists (
     select 1 from public."Stores" as s where s.owner_id = u.id
   )
on conflict (id) do nothing;

delete from public."Stores" as s
where s.owner_id is null
   or not exists (
     select 1 from public."Users" as u where u.id = s.owner_id
   );

do $$
declare
  legacy_constraint text;
begin
  -- Remove the old Stores.id -> auth.users foreign key. New Stores.id values
  -- are independent IDs; ownership is represented by Stores.owner_id instead.
  select c.conname
  into legacy_constraint
  from pg_constraint c
  join pg_attribute a
    on a.attrelid = c.conrelid
   and a.attnum = any (c.conkey)
  where c.conrelid = 'public."Stores"'::regclass
    and c.contype = 'f'
    and c.confrelid = 'auth.users'::regclass
    and a.attname = 'id'
  limit 1;

  if legacy_constraint is not null then
    execute format('alter table public."Stores" drop constraint %I', legacy_constraint);
  end if;

  if not exists (
    select 1
    from pg_constraint c
    join pg_attribute a
      on a.attrelid = c.conrelid
     and a.attnum = any (c.conkey)
    where c.conrelid = 'public."Stores"'::regclass
      and c.contype = 'f'
      and c.confrelid = 'public."Users"'::regclass
      and a.attname = 'owner_id'
  ) then
    alter table public."Stores"
      add constraint "Stores_owner_id_fkey"
      foreign key (owner_id) references public."Users" (id) on delete cascade;
  end if;
end;
$$;

alter table public."Stores" alter column id set default gen_random_uuid();
alter table public."Stores" alter column owner_id set not null;

create table if not exists public."Offers" (
  offer_id uuid primary key default gen_random_uuid(),
  offer_name text not null,
  posted_time timestamptz not null default now(),
  offer_start_time timestamptz,
  offer_end_time timestamptz,
  offer_completed boolean not null default false,
  offer_description text,
  store_id uuid references public."Stores" (id) on delete cascade,
  views bigint not null default 0
);

-- create table if not exists does not add defaults to an existing table.
-- Repair defaults left behind by earlier versions of the Offers schema.
alter table public."Offers" alter column offer_id set default gen_random_uuid();
alter table public."Offers" add column if not exists offer_name text;
alter table public."Offers" add column if not exists offer_start_time timestamptz;
update public."Offers"
set offer_name = 'Food offer'
where offer_name is null;
alter table public."Offers" alter column offer_name set default 'Food offer';
alter table public."Offers" alter column offer_name set not null;
alter table public."Offers" alter column posted_time set default now();
alter table public."Offers" alter column offer_completed set default false;
alter table public."Offers" alter column views set default 0;

create index if not exists stores_owner_id_idx on public."Stores" (owner_id);
create index if not exists offers_store_id_idx on public."Offers" (store_id);
create index if not exists offers_posted_time_idx on public."Offers" (posted_time desc);

create or replace function public.handle_new_store_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- The web registration flow always creates both sides of the owner/store
  -- relationship in this transaction. The trigger's WHEN clause guarantees
  -- this function only runs for account_type = 'store'.
  insert into public."Users" (id, name, image)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'store_name',
      new.raw_user_meta_data->>'business_name'
    ),
    new.raw_user_meta_data->>'image'
  )
  on conflict (id) do nothing;

  insert into public."Stores" (owner_id, name, address, description, store_type, image)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'store_name',
      new.raw_user_meta_data->>'business_name',
      'New store'
    ),
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'description',
    case
      when new.raw_user_meta_data->>'store_type' in ('Pantry', 'Business', 'Campus', 'Restaurant')
        then new.raw_user_meta_data->>'store_type'
      else 'Business'
    end::public."StoreType",
    new.raw_user_meta_data->>'image'
  );

  return new;
end;
$$;

-- Keep store-owner provisioning independent of the mobile app's student
-- trigger. PostgreSQL permits both triggers on auth.users.
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_store_owner_created on auth.users;
create trigger on_auth_store_owner_created
  after insert on auth.users
  for each row
  when (new.raw_user_meta_data->>'account_type' = 'store')
  execute function public.handle_new_store_owner();

-- Add stores for existing web accounts only when they do not already own one.
insert into public."Stores" (owner_id, name, address, description, store_type, image)
select
  u.id,
  coalesce(
    u.raw_user_meta_data->>'store_name',
    u.raw_user_meta_data->>'business_name',
    'New store'
  ),
  u.raw_user_meta_data->>'address',
  u.raw_user_meta_data->>'description',
  case
    when u.raw_user_meta_data->>'store_type' in ('Pantry', 'Business', 'Campus', 'Restaurant')
      then u.raw_user_meta_data->>'store_type'
    else 'Business'
  end::public."StoreType",
  u.raw_user_meta_data->>'image'
from auth.users as u
where u.raw_user_meta_data->>'account_type' = 'store'
  and not exists (
    select 1 from public."Stores" as s where s.owner_id = u.id
  );

alter table public."Stores" enable row level security;
alter table public."Users" enable row level security;
alter table public."Offers" enable row level security;

drop policy if exists "Public can read stores" on public."Stores";
create policy "Public can read stores"
  on public."Stores" for select
  using (true);

-- Remove names used by the previous id-is-owner policy before adding the
-- owner_id-based replacement below.
drop policy if exists "Users can insert own store" on public."Stores";
drop policy if exists "Users can update own store" on public."Stores";
drop policy if exists "Users can insert own stores" on public."Stores";
create policy "Users can insert own stores"
  on public."Stores" for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Users can update own stores" on public."Stores";
create policy "Users can update own stores"
  on public."Stores" for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Users can read own user profile" on public."Users";
create policy "Users can read own user profile"
  on public."Users" for select
  using (auth.uid() = id);

drop policy if exists "Users can update own user profile" on public."Users";
create policy "Users can update own user profile"
  on public."Users" for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Anyone can read active offers" on public."Offers";
create policy "Anyone can read active offers"
  on public."Offers" for select
  using (
    offer_completed = false
    or exists (
      select 1 from public."Stores" s
      where s.id = store_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists "Stores can insert own offers" on public."Offers";
create policy "Stores can insert own offers"
  on public."Offers" for insert
  with check (
    exists (
      select 1 from public."Stores" s
      where s.id = store_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists "Stores can update own offers" on public."Offers";
create policy "Stores can update own offers"
  on public."Offers" for update
  using (
    exists (
      select 1 from public."Stores" s
      where s.id = store_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public."Stores" s
      where s.id = store_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists "Stores can delete own offers" on public."Offers";
create policy "Stores can delete own offers"
  on public."Offers" for delete
  using (
    exists (
      select 1 from public."Stores" s
      where s.id = store_id and s.owner_id = auth.uid()
    )
  );

-- The public feed can count a view without receiving permission to modify
-- arbitrary offer fields. Completed offers are intentionally excluded.
create or replace function public.increment_offer_views(target_offer_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_views bigint;
begin
  update public."Offers"
  set views = views + 1
  where offer_id = target_offer_id
    and offer_completed = false
  returning views into updated_views;

  if updated_views is null then
    raise exception 'Active offer % was not found', target_offer_id
      using errcode = 'P0002';
  end if;

  return updated_views;
end;
$$;

grant usage on schema public to anon, authenticated;
grant select on public."Stores" to anon, authenticated;
grant insert, update on public."Stores" to authenticated;
grant select, update on public."Users" to authenticated;
grant select on public."Offers" to anon, authenticated;
grant insert, update, delete on public."Offers" to authenticated;
grant execute on function public.increment_offer_views(uuid) to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('store-images', 'store-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can view store images" on storage.objects;
create policy "Public can view store images"
  on storage.objects for select
  using (bucket_id = 'store-images');

drop policy if exists "Store owners can upload store images" on storage.objects;
create policy "Store owners can upload store images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'store-images'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Store owners can update store images" on storage.objects;
create policy "Store owners can update store images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'store-images'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'store-images'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Store owners can delete store images" on storage.objects;
create policy "Store owners can delete store images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'store-images'
    and split_part(name, '/', 1) = auth.uid()::text
  );
