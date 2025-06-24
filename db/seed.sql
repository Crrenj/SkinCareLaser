-- 0. Extensions (UUID + fonctions utiles)
create extension if not exists "pgcrypto";

--------------------------------------------------
-- 1. Profils liés à auth.users
--------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text default 'customer' check (role in ('customer','admin')),
  created_at timestamptz default now()
);

--------------------------------------------------
-- 2. Catalogue
--------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,                     -- /produits/<slug>
  description text,
  price numeric(10,2) not null check (price >= 0),
  currency char(3) default 'DOP',
  stock int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Images multiples (stockées dans Supabase Storage, ici on garde l’URL)
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  url text not null,
  alt text
);

-- Pivot catégorie ↔ produit (n-n)
create table public.product_categories (
  product_id uuid references public.products(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  primary key (product_id, category_id)
);

--------------------------------------------------
-- 3. Panier
--------------------------------------------------
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  anonymous_id uuid,                    -- si pas connecté (cookie)
  created_at timestamptz default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid references public.carts(id) on delete cascade,
  product_id uuid references public.products(id),
  quantity int not null check (quantity > 0),
  unique (cart_id, product_id)
);

--------------------------------------------------
-- 4. Commandes
--------------------------------------------------
create type order_status as enum ('pending','paid','shipped','completed','cancelled');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  status order_status default 'pending',
  total numeric(10,2),
  created_at timestamptz default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  unit_price numeric(10,2),
  quantity int not null check (quantity > 0)
);

--------------------------------------------------
-- 5. Triggers (mise à jour automatique du champ updated_at)
--------------------------------------------------
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

create trigger set_product_updated_at
before update on public.products
for each row execute procedure public.tg_set_updated_at();

--------------------------------------------------
-- 6. Row Level Security (RLS) minimal
--------------------------------------------------
alter table public.products          enable row level security;
alter table public.categories        enable row level security;
alter table public.product_images    enable row level security;
alter table public.product_categories enable row level security;
alter table public.carts             enable row level security;
alter table public.cart_items        enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;
alter table public.profiles          enable row level security;

-- Lecture publique du catalogue
create policy "Public read products" on public.products
  for select using (true);
create policy "Public read categories" on public.categories
  for select using (true);
create policy "Public read images" on public.product_images
  for select using (true);
create policy "Public read pivot" on public.product_categories
  for select using (true);

-- Accès utilisateur à son panier
create policy "Cart owner" on public.carts
  for all using (user_id = auth.uid());

create policy "Cart items by owner" on public.cart_items
  for all using (
    cart_id in (select id from public.carts where user_id = auth.uid())
  );

-- Accès utilisateur à ses commandes
create policy "Order owner" on public.orders
  for all using (user_id = auth.uid());

create policy "Order items by owner" on public.order_items
  for all using (
    order_id in (select id from public.orders where user_id = auth.uid())
  );
