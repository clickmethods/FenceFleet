-- FenceFlow v2: damage waiver, public booking requests, customer portal.
-- Run AFTER schema.sql.

alter table orders add column if not exists waiver_pct numeric(5,2) default 12,
  add column if not exists waiver_accepted boolean default true;

create table if not exists booking_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  email text not null,
  phone text,
  site_address text not null,
  start_date date not null,
  end_date date not null,
  footage int,
  notes text,
  status text not null default 'new', -- new | converted | dismissed
  created_at timestamptz not null default now()
);
alter table booking_requests enable row level security;
create policy "read_booking_requests" on booking_requests for select to authenticated using (true);
create policy "admin_all_booking_requests" on booking_requests for all to authenticated using (is_admin()) with check (is_admin());

-- Public booking submission (anon-safe, no table grants needed)
create or replace function submit_booking(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare rid uuid;
begin
  insert into booking_requests (name, company, email, phone, site_address, start_date, end_date, footage, notes)
  values (p->>'name', p->>'company', p->>'email', p->>'phone', p->>'site_address',
          (p->>'start_date')::date, (p->>'end_date')::date, nullif(p->>'footage','')::int, p->>'notes')
  returning id into rid;
  return rid;
end $$;
grant execute on function submit_booking(jsonb) to anon, authenticated;

-- Customer portal lookup: email + order number, returns order summary
create or replace function portal_lookup(p_email text, p_order int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o record; v_lines jsonb; v_paid numeric; v_days int; v_rental numeric; v_waiver numeric; v_tax numeric; v_total numeric;
begin
  select ord.*, c.name as customer_name, c.tax_rate, c.tax_exempt into o
  from orders ord join customers c on c.id = ord.customer_id
  where ord.order_number = p_order and lower(c.email) = lower(p_email);
  if not found then return null; end if;
  v_days := greatest(1, o.end_date - o.start_date);
  select coalesce(jsonb_agg(jsonb_build_object('unit', i.unit_number, 'category', i.category, 'rate', oi.rate)), '[]'::jsonb),
         coalesce(sum(oi.rate), 0) * v_days
    into v_lines, v_rental
  from order_items oi join inventory_items i on i.id = oi.item_id where oi.order_id = o.id;
  v_waiver := case when o.waiver_accepted then round(v_rental * coalesce(o.waiver_pct,0)/100, 2) else 0 end;
  v_tax := case when o.tax_exempt then 0 else round(v_rental * coalesce(o.tax_rate,0)/100, 2) end;
  v_total := v_rental + v_waiver + v_tax + coalesce(o.fuel_fee, 0);
  select coalesce(sum(amount), 0) into v_paid from payments where order_id = o.id;
  return jsonb_build_object('order_number', o.order_number, 'customer', o.customer_name,
    'status', o.status, 'payment_status', o.payment_status, 'site_address', o.site_address,
    'start_date', o.start_date, 'end_date', o.end_date, 'days', v_days, 'lines', v_lines,
    'rental', v_rental, 'waiver', v_waiver, 'tax', v_tax, 'fuel_fee', o.fuel_fee,
    'total', v_total, 'paid', v_paid, 'balance', v_total - v_paid, 'order_id', o.id);
end $$;
grant execute on function portal_lookup(text, int) to anon, authenticated;
