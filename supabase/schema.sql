-- TableQR — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → paste → Run

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────

create table if not exists tables (
  id uuid primary key default gen_random_uuid(),
  table_number int not null unique,
  created_at timestamptz not null default now()
);

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  category text not null,
  image_url text,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references tables(id),
  status text not null default 'received' check (status in ('received', 'preparing', 'served')),
  total_amount numeric(10,2) not null check (total_amount >= 0),
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id),
  item_name text not null,        -- snapshot, so receipts stay correct if menu changes later
  price_at_order numeric(10,2) not null check (price_at_order >= 0),
  quantity int not null check (quantity > 0),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_table_id on orders(table_id);
create index if not exists idx_order_items_order_id on order_items(order_id);
create index if not exists idx_menu_items_category on menu_items(category);

-- ─────────────────────────────────────────────
-- REALTIME (for the admin/kitchen dashboard, built later)
-- ─────────────────────────────────────────────

alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- The Flask backend uses the SERVICE ROLE key, which bypasses RLS entirely,
-- so these policies only govern anything that talks to Supabase directly
-- (e.g. a future admin dashboard reading with the anon key).
-- ─────────────────────────────────────────────

alter table tables enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "anyone can read tables" on tables
  for select using (true);

create policy "anyone can read available menu items" on menu_items
  for select using (true);

create policy "anyone can read orders" on orders
  for select using (true);

create policy "anyone can read order items" on order_items
  for select using (true);

-- No insert/update/delete policies for anon are defined on purpose —
-- all writes go through the Flask backend's service role key.

-- ─────────────────────────────────────────────
-- SEED DATA — a few tables + a starter menu so you can test ordering immediately
-- ─────────────────────────────────────────────

insert into tables (table_number)
values (1), (2), (3), (4), (5)
on conflict (table_number) do nothing;

insert into menu_items (name, description, price, category, is_available) values
  ('Masala Chai', 'Spiced milk tea, brewed fresh', 40.00, 'Beverages', true),
  ('Cold Coffee', 'Iced coffee blended with milk and ice cream', 90.00, 'Beverages', true),
  ('Fresh Lime Soda', 'Sweet, salted, or mixed', 60.00, 'Beverages', true),
  ('Veg Spring Rolls', 'Crispy rolls with mixed vegetable filling', 150.00, 'Starters', true),
  ('Paneer Tikka', 'Char-grilled cottage cheese, smoky marinade', 220.00, 'Starters', true),
  ('Chicken 65', 'Spicy, deep-fried chicken bites', 240.00, 'Starters', true),
  ('Butter Chicken', 'Chicken simmered in a rich tomato-butter gravy', 320.00, 'Main Course', true),
  ('Paneer Butter Masala', 'Cottage cheese in a creamy tomato gravy', 280.00, 'Main Course', true),
  ('Veg Biryani', 'Fragrant basmati rice layered with vegetables', 240.00, 'Main Course', true),
  ('Dal Tadka', 'Yellow lentils tempered with ghee and cumin', 180.00, 'Main Course', true),
  ('Butter Naan', 'Tandoor-baked leavened bread', 50.00, 'Breads', true),
  ('Garlic Naan', 'Tandoor-baked bread topped with garlic', 60.00, 'Breads', true),
  ('Gulab Jamun', 'Milk dumplings in rose-cardamom syrup', 90.00, 'Desserts', true),
  ('Gajar Halwa', 'Slow-cooked carrot pudding with nuts', 110.00, 'Desserts', true)
on conflict do nothing;
