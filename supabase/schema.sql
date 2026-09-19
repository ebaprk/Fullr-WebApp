-- Fullr schema: businesses post live food offers; the iOS app reads them.
-- Run this once in the Supabase SQL Editor.

create table if not exists public.businesses (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  category text,
  address text,
  city text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'Meals',
  price numeric(10,2) not null check (price >= 0),
  original_price numeric(10,2) check (original_price is null or original_price >= 0),
  quantity integer not null default 1 check (quantity >= 0),
  pickup_start timestamptz,
  pickup_end timestamptz,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists offers_business_id_idx on public.offers (business_id);
create index if not exists offers_active_created_idx on public.offers (is_active, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists offers_set_updated_at on public.offers;
create trigger offers_set_updated_at
  before update on public.offers
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.businesses (id, name, email, category, address, city, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'business_name', 'New business'),
    coalesce(new.email, ''),
    new.raw_user_meta_data->>'category',
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.businesses enable row level security;
alter table public.offers enable row level security;

drop policy if exists "Public can read businesses" on public.businesses;
create policy "Public can read businesses"
  on public.businesses for select
  using (true);

drop policy if exists "Users can insert own business" on public.businesses;
create policy "Users can insert own business"
  on public.businesses for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own business" on public.businesses;
create policy "Users can update own business"
  on public.businesses for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Anyone can read active offers" on public.offers;
create policy "Anyone can read active offers"
  on public.offers for select
  using (is_active = true or auth.uid() = business_id);

drop policy if exists "Businesses can insert own offers" on public.offers;
create policy "Businesses can insert own offers"
  on public.offers for insert
  with check (auth.uid() = business_id);

drop policy if exists "Businesses can update own offers" on public.offers;
create policy "Businesses can update own offers"
  on public.offers for update
  using (auth.uid() = business_id)
  with check (auth.uid() = business_id);

drop policy if exists "Businesses can delete own offers" on public.offers;
create policy "Businesses can delete own offers"
  on public.offers for delete
  using (auth.uid() = business_id);

create or replace view public.live_offers
with (security_invoker = true)
as
select
  o.id,
  o.title,
  o.description,
  o.category,
  o.price,
  o.original_price,
  o.quantity,
  o.pickup_start,
  o.pickup_end,
  o.image_url,
  o.created_at,
  o.updated_at,
  b.id as business_id,
  b.name as business_name,
  b.address,
  b.city,
  b.phone,
  b.category as business_category
from public.offers o
join public.businesses b on b.id = o.business_id
where o.is_active = true
  and o.quantity > 0;

grant usage on schema public to anon, authenticated;
grant select on public.businesses to anon, authenticated;
grant insert, update on public.businesses to authenticated;
grant select on public.offers to anon, authenticated;
grant insert, update, delete on public.offers to authenticated;
grant select on public.live_offers to anon, authenticated;

-- Optional: in the Supabase dashboard, enable Realtime on public.offers
-- so the iOS app can subscribe to live offer changes.
