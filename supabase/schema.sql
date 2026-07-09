-- FenceFlow schema. Run in Supabase SQL Editor.
create type user_role as enum ('admin','driver');
create type item_status as enum ('available','on_rent','reserved','soft_down');
create type order_status as enum ('reserved','on_rent','returned','overdue','cancelled');
create type delivery_direction as enum ('going_out','coming_in');
create type delivery_status as enum ('unassigned','assigned','in_transit','completed');
create type payment_status as enum ('unpaid','partial','paid','refunded');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null default '',
  role user_role not null default 'driver',
  phone text,
  created_at timestamptz not null default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  email text,
  phone text,
  billing_address text,
  delivery_address text,
  secondary_contact text,
  credit_limit numeric(10,2) default 0,
  tax_exempt boolean default false,
  tax_rate numeric(5,3) default 8.31, -- Denver combined default
  notes text,
  created_at timestamptz not null default now()
);

create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  unit_number text not null unique,
  category text not null,            -- panel, post, gate, base, sandbag, windscreen
  serial_number text,
  description text,
  location text default 'Yard',
  status item_status not null default 'available',
  daily_rate numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number serial,
  customer_id uuid not null references customers on delete restrict,
  status order_status not null default 'reserved',
  start_date date not null,
  end_date date not null,
  site_address text not null,
  delivery_method text not null default 'delivery', -- delivery | pickup
  fuel_fee numeric(10,2) default 0,
  deposit numeric(10,2) default 0,
  payment_status payment_status not null default 'unpaid',
  notes text,
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders on delete cascade,
  item_id uuid not null references inventory_items on delete restrict,
  rate numeric(10,2) not null default 0
);

create table deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders on delete cascade,
  driver_id uuid references profiles,
  direction delivery_direction not null,
  status delivery_status not null default 'unassigned',
  scheduled_date date not null,
  completed_at timestamptz,
  notes text
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders on delete cascade,
  amount numeric(10,2) not null,
  method text not null default 'card', -- card | check | cash | ach
  reference text,
  paid_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers on delete cascade,
  order_id uuid references orders on delete cascade,
  name text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup (first user becomes admin)
create or replace function handle_new_user() returns trigger
language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''),
    case when (select count(*) from public.profiles)=0 then 'admin'::user_role else 'driver'::user_role end);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function handle_new_user();

-- RLS: any authenticated user can read; admins write everything; drivers update their deliveries
alter table profiles enable row level security;
alter table customers enable row level security;
alter table inventory_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table deliveries enable row level security;
alter table payments enable row level security;
alter table documents enable row level security;

create or replace function is_admin() returns boolean language sql stable as
$$ select exists(select 1 from profiles where id = auth.uid() and role='admin') $$;

do $$ declare t text;
begin
  foreach t in array array['profiles','customers','inventory_items','orders','order_items','deliveries','payments','documents'] loop
    execute format('create policy "read_%s" on %I for select to authenticated using (true)', t, t);
    execute format('create policy "admin_all_%s" on %I for all to authenticated using (is_admin()) with check (is_admin())', t, t);
  end loop;
end $$;

create policy "driver_update_delivery" on deliveries for update to authenticated
  using (driver_id = auth.uid()) with check (driver_id = auth.uid());
create policy "own_profile" on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
