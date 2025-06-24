
-- =========================================================
-- 📦  Supabase e‑commerce skincare schema (DDL only)
-- =========================================================

-- 0. Extensions
create extension if not exists "pgcrypto";

-- 1. Auth‑linked profiles ---------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text default 'customer' check (role in ('customer','admin')),
  created_at timestamptz default now()
);

-- 2. Catalogue --------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  description text,
  price numeric(10,2) not null check (price >= 0),
  currency char(3) default 'DOP',
  stock int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tags = catégories, besoins, ingrédients, gammes, marques…
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  tag_type text not null
    check (tag_type in ('category','need','skin_type','ingredient','range','brand'))
);

create unique index if not exists tags_type_slug_idx
  on public.tags(tag_type, slug);

-- Pivot produit ↔ tag
create table if not exists public.product_tags (
  product_id uuid references public.products(id) on delete cascade,
  tag_id     uuid references public.tags(id)     on delete cascade,
  primary key (product_id, tag_id)
);

-- Images multiples stockées en externe (Supabase Storage, Cloudinary…)
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  url text not null,
  alt text
);

-- 3. Panier -----------------------------------------------
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  anonymous_id uuid,
  created_at timestamptz default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references public.carts(id) on delete cascade,
  product_id uuid references public.products(id),
  quantity int not null check (quantity > 0),
  unique (cart_id, product_id)
);

-- 4. Commandes --------------------------------------------
create type if not exists order_status as enum ('pending','paid','shipped','completed','cancelled');

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  status order_status default 'pending',
  total numeric(10,2),
  created_at timestamptz default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  unit_price numeric(10,2),
  quantity int not null check (quantity > 0)
);

-- 5. Trigger: updated_at ----------------------------------
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

create trigger if not exists set_product_updated_at
before update on public.products
for each row execute procedure public.tg_set_updated_at();

-- 6. Row Level Security -----------------------------------
alter table public.products          enable row level security;
alter table public.tags              enable row level security;
alter table public.product_images    enable row level security;
alter table public.product_tags      enable row level security;
alter table public.carts             enable row level security;
alter table public.cart_items        enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;
alter table public.profiles          enable row level security;

-- Policies: lecture publique catalogue
create policy if not exists "Public read products" on public.products
  for select using (true);

create policy if not exists "Public read tags" on public.tags
  for select using (true);

create policy if not exists "Public read images" on public.product_images
  for select using (true);

create policy if not exists "Public read pivot" on public.product_tags
  for select using (true);

-- Accès propriétaire panier
create policy if not exists "Cart owner" on public.carts
  for all using (user_id = auth.uid());

create policy if not exists "Cart items by owner" on public.cart_items
  for all using (
    cart_id in (select id from public.carts where user_id = auth.uid())
  );

-- Accès propriétaire commandes
create policy if not exists "Order owner" on public.orders
  for all using (user_id = auth.uid());

create policy if not exists "Order items by owner" on public.order_items
  for all using (
    order_id in (select id from public.orders where user_id = auth.uid())
  );

-- =========================================================
-- Fin du DDL
-- =========================================================
