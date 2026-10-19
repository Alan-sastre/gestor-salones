-- Base de datos de prueba para prestamos de espacios y equipos.
-- El acceso por ID es solo demostrativo; no autentica la identidad del docente.

create table if not exists public.professors (
  code text primary key,
  name text not null
);

create table if not exists public.spaces (
  id integer primary key,
  name text not null,
  capacity integer not null check (capacity > 0),
  description text not null,
  features text[] not null default '{}'
);

create table if not exists public.equipment (
  id text primary key,
  name text not null,
  type text not null,
  description text not null,
  model_url text not null default '',
  total_units integer not null check (total_units > 0)
);

alter table public.equipment
  add column if not exists model_url text not null default '';

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  professor_code text not null references public.professors(code),
  space_id integer not null references public.spaces(id),
  reservation_date date not null,
  start_time time not null,
  end_time time not null,
  reason text not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  check (start_time >= time '07:00' and end_time <= time '21:00'),
  check (start_time < end_time)
);

create table if not exists public.equipment_reservations (
  id uuid primary key default gen_random_uuid(),
  professor_code text not null references public.professors(code),
  equipment_id text not null references public.equipment(id),
  reservation_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  check (start_time >= time '07:00' and end_time <= time '21:00'),
  check (start_time < end_time)
);

-- Compatibility for projects where the previous Auth-based schema was applied.
alter table public.reservations
  add column if not exists professor_code text references public.professors(code);
alter table public.equipment_reservations
  add column if not exists professor_code text references public.professors(code);

alter table public.reservations alter column professor_code drop not null;
alter table public.equipment_reservations alter column professor_code drop not null;
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reservations' and column_name = 'user_id'
  ) then
    alter table public.reservations alter column user_id drop not null;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'equipment_reservations' and column_name = 'user_id'
  ) then
    alter table public.equipment_reservations alter column user_id drop not null;
  end if;
end $$;

-- Previous Auth-only sample rows have no test professor; archive them.
update public.reservations set status = 'cancelled'
where professor_code is null and status = 'confirmed';
update public.equipment_reservations set status = 'cancelled'
where professor_code is null and status = 'confirmed';

insert into public.professors (code, name)
values
  ('1001', 'Ana Martínez'),
  ('1002', 'Carlos Ruiz'),
  ('1003', 'María López'),
  ('1004', 'José Hernández'),
  ('1005', 'Laura Gómez')
on conflict (code) do update set name = excluded.name;

insert into public.spaces (id, name, capacity, description, features)
values
  (0, 'Auditorio Principal', 30, 'Sala amplia con escenario, sonido profesional y proyector para conferencias y eventos institucionales.', array['Escenario', 'Audio profesional', 'Proyector', 'Capacidad para 30 personas']),
  (1, 'Laboratorio de Cómputo', 30, '30 equipos con internet de alta velocidad y software especializado para clases prácticas.', array['30 equipos', 'Internet alta velocidad', 'Software especializado', 'Mesas de trabajo']),
  (2, 'Sala de Audiovisuales', 30, 'Pantalla grande, audio envolvente y butacas cómodas para proyecciones y presentaciones.', array['Pantalla grande', 'Audio envolvente', 'Butacas', 'Proyección multimedia']),
  (3, 'Biblioteca - Sala de Estudio', 30, 'Espacio silencioso con mesas grupales, tablero y acceso al catálogo de la biblioteca.', array['Mesas grupales', 'Tablero', 'Ambiente silencioso', 'Acceso a biblioteca']),
  (4, 'Laboratorio de Ciencias', 30, 'Mesones, equipos de medición y material de seguridad para prácticas de química y biología.', array['Mesones de trabajo', 'Equipos de medición', 'Material de seguridad', 'Prácticas científicas'])
on conflict (id) do update set
  name = excluded.name,
  capacity = excluded.capacity,
  description = excluded.description,
  features = excluded.features;

-- Remove demo reservations tied to equipment that is no longer the same item.
delete from public.equipment_reservations er
using public.equipment e
where er.equipment_id = e.id
  and (
    e.id not in ('EQ-01', 'EQ-02', 'EQ-03', 'EQ-04')
    or (e.id = 'EQ-03' and (e.name is distinct from 'Cortadora láser' or e.type is distinct from 'cortadora'))
    or (e.id = 'EQ-04' and (e.name is distinct from 'Pantalla Inteligente' or e.type is distinct from 'pantalla'))
  );

delete from public.equipment
where id not in ('EQ-01', 'EQ-02', 'EQ-03', 'EQ-04');

insert into public.equipment (id, name, type, description, model_url, total_units)
values
  ('EQ-01', 'Gafas de Realidad Virtual', 'Gafas', 'Gafas de realidad virtual con pantalla de alta resolución y sensores de movimiento.', 'https://sketchfab.com/models/3284672ec1524a82ab3dd0c668868fad/embed?autospin=1&autostart=1&preload=1&transparent=1&ui_animations=0&ui_infos=0&ui_stop=0&ui_inspector=0&ui_watermark_link=0&ui_watermark=0&ui_ar=0&ui_help=0&ui_settings=0&ui_vr=0&ui_fullscreen=0&ui_annotations=0', 5),
  ('EQ-02', 'Impresora 3D', 'impresora', 'Impresora 3D de alto rendimiento con capacidad de impresión en 3D de alta calidad.', 'https://sketchfab.com/models/d464350f38c6451c9bcda1980a7e2fcc/embed?autospin=1&autostart=1&preload=1&transparent=1', 2),
  ('EQ-03', 'Cortadora láser', 'cortadora', 'Máquina de corte láser con precisión y eficiencia para trabajos de diseño y prototipado.', 'https://sketchfab.com/3d-models/3d-full-laser-co2-60x40-afdcb2c12d1948658c444bc372f26a4e/embed?autospin=1&autostart=1&preload=1&transparent=1', 2),
  ('EQ-04', 'Pantalla Inteligente', 'pantalla', 'Pantalla inteligente con tecnología de visualización avanzada y conectividad inalámbrica.', 'https://sketchfab.com/models/fdc6d248ca6d4b789110de6a1a99b6fe/embed?autospin=1&autostart=1&preload=1&transparent=1', 1)
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  description = excluded.description,
  model_url = excluded.model_url,
  total_units = excluded.total_units;

create index if not exists reservations_space_date_status_idx
  on public.reservations (space_id, reservation_date, status);
create index if not exists reservations_professor_date_idx
  on public.reservations (professor_code, reservation_date, status);
create index if not exists equipment_reservations_equipment_date_status_idx
  on public.equipment_reservations (equipment_id, reservation_date, status);
create index if not exists equipment_reservations_professor_date_idx
  on public.equipment_reservations (professor_code, reservation_date, status);

alter table public.professors enable row level security;
alter table public.spaces enable row level security;
alter table public.equipment enable row level security;
alter table public.reservations enable row level security;
alter table public.equipment_reservations enable row level security;

drop policy if exists "Public demo reads spaces" on public.spaces;
create policy "Public demo reads spaces" on public.spaces for select to anon, authenticated using (true);
drop policy if exists "Public demo reads equipment" on public.equipment;
create policy "Public demo reads equipment" on public.equipment for select to anon, authenticated using (true);

grant select on public.spaces, public.equipment to anon, authenticated;
revoke all on public.professors, public.reservations, public.equipment_reservations from anon, authenticated;
revoke all on public.reservations, public.equipment_reservations from anon, authenticated;

create or replace function public.lookup_test_professor(p_code text)
returns table (code text, name text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.code, p.name
  from public.professors p
  where p.code = trim(p_code);
$$;

create or replace function public.get_test_reservations(p_professor_code text)
returns table (
  reservation_id uuid,
  resource_type text,
  resource_id text,
  reservation_date date,
  start_time time,
  end_time time,
  reason text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select r.id, 'space'::text, r.space_id::text, r.reservation_date, r.start_time, r.end_time, r.reason
  from public.reservations r
  where r.professor_code = trim(p_professor_code) and r.status = 'confirmed'
  union all
  select er.id, 'equipment'::text, er.equipment_id, er.reservation_date, er.start_time, er.end_time, null::text
  from public.equipment_reservations er
  where er.professor_code = trim(p_professor_code) and er.status = 'confirmed';
$$;

drop function if exists public.get_reservation_availability(date, date);
create function public.get_reservation_availability(p_start_date date, p_end_date date)
returns table (
  reservation_id uuid,
  resource_type text,
  resource_id text,
  reservation_date date,
  start_time time,
  end_time time,
  reason text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select r.id, 'space'::text, r.space_id::text, r.reservation_date, r.start_time, r.end_time, r.reason
  from public.reservations r
  where r.status = 'confirmed' and r.reservation_date between p_start_date and p_end_date
  union all
  select er.id, 'equipment'::text, er.equipment_id, er.reservation_date, er.start_time, er.end_time, null::text
  from public.equipment_reservations er
  where er.status = 'confirmed' and er.reservation_date between p_start_date and p_end_date;
$$;

create or replace function public.save_test_space_reservation(
  p_professor_code text,
  p_id uuid,
  p_space_id integer,
  p_date date,
  p_start time,
  p_end time,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  if not exists (select 1 from public.professors where code = trim(p_professor_code)) then
    raise exception 'Professor ID not found';
  end if;
  if p_date < current_date or p_start < time '07:00' or p_end > time '21:00' or p_start >= p_end then
    raise exception 'Invalid reservation date or time';
  end if;
  if coalesce(length(trim(p_reason)), 0) = 0 then
    raise exception 'Reservation reason is required';
  end if;

  perform 1 from public.spaces where id = p_space_id for update;
  if not found then raise exception 'Space not found'; end if;

  if p_id is not null then
    select id into v_id from public.reservations
    where id = p_id and professor_code = trim(p_professor_code) and status = 'confirmed'
    for update;
    if v_id is null then raise exception 'Reservation not found'; end if;
  end if;

  if exists (
    select 1 from public.reservations r
    where r.space_id = p_space_id and r.reservation_date = p_date and r.status = 'confirmed'
      and (p_id is null or r.id <> p_id)
      and p_start < r.end_time and p_end > r.start_time
  ) then
    raise exception 'Time slot is occupied in this space';
  end if;

  if p_id is null then
    insert into public.reservations (professor_code, space_id, reservation_date, start_time, end_time, reason)
    values (trim(p_professor_code), p_space_id, p_date, p_start, p_end, trim(p_reason))
    returning id into v_id;
  else
    update public.reservations set space_id = p_space_id, reservation_date = p_date,
      start_time = p_start, end_time = p_end, reason = trim(p_reason)
    where id = p_id and professor_code = trim(p_professor_code)
    returning id into v_id;
  end if;
  return v_id;
end;
$$;

create or replace function public.save_test_equipment_reservation(
  p_professor_code text,
  p_id uuid,
  p_equipment_id text,
  p_date date,
  p_start time,
  p_end time
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_total integer;
  v_peak bigint;
begin
  if not exists (select 1 from public.professors where code = trim(p_professor_code)) then
    raise exception 'Professor ID not found';
  end if;
  if p_date < current_date or p_start < time '07:00' or p_end > time '21:00' or p_start >= p_end then
    raise exception 'Invalid reservation date or time';
  end if;

  select total_units into v_total from public.equipment where id = p_equipment_id for update;
  if not found then raise exception 'Equipment not found'; end if;

  if p_id is not null then
    select id into v_id from public.equipment_reservations
    where id = p_id and professor_code = trim(p_professor_code) and status = 'confirmed'
    for update;
    if v_id is null then raise exception 'Reservation not found'; end if;
  end if;

  select coalesce(max((
    select count(*) + 1
    from public.equipment_reservations er
    where er.equipment_id = p_equipment_id and er.reservation_date = p_date and er.status = 'confirmed'
      and (p_id is null or er.id <> p_id)
      and er.start_time <= slots.slot_start and er.end_time > slots.slot_start
  )), 0) into v_peak
  from (
    select p_start as slot_start
    union
    select er.start_time from public.equipment_reservations er
    where er.equipment_id = p_equipment_id and er.reservation_date = p_date
      and er.status = 'confirmed' and (p_id is null or er.id <> p_id)
      and er.start_time > p_start and er.start_time < p_end
  ) slots;

  if v_peak > v_total then raise exception 'No equipment units available for this time slot'; end if;

  if p_id is null then
    insert into public.equipment_reservations (professor_code, equipment_id, reservation_date, start_time, end_time)
    values (trim(p_professor_code), p_equipment_id, p_date, p_start, p_end)
    returning id into v_id;
  else
    update public.equipment_reservations set equipment_id = p_equipment_id, reservation_date = p_date,
      start_time = p_start, end_time = p_end
    where id = p_id and professor_code = trim(p_professor_code)
    returning id into v_id;
  end if;
  return v_id;
end;
$$;

create or replace function public.cancel_test_reservation(p_professor_code text, p_id uuid, p_resource_type text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_updated integer;
begin
  if not exists (select 1 from public.professors where code = trim(p_professor_code)) then
    raise exception 'Professor ID not found';
  end if;
  if p_resource_type = 'space' then
    update public.reservations set status = 'cancelled'
    where id = p_id and professor_code = trim(p_professor_code) and status = 'confirmed';
  elsif p_resource_type = 'equipment' then
    update public.equipment_reservations set status = 'cancelled'
    where id = p_id and professor_code = trim(p_professor_code) and status = 'confirmed';
  else
    raise exception 'Invalid reservation type';
  end if;
  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

revoke all on function public.lookup_test_professor(text) from public;
revoke all on function public.get_test_reservations(text) from public;
revoke all on function public.get_reservation_availability(date, date) from public;
revoke all on function public.save_test_space_reservation(text, uuid, integer, date, time, time, text) from public;
revoke all on function public.save_test_equipment_reservation(text, uuid, text, date, time, time) from public;
revoke all on function public.cancel_test_reservation(text, uuid, text) from public;

grant execute on function public.lookup_test_professor(text) to anon, authenticated;
grant execute on function public.get_test_reservations(text) to anon, authenticated;
grant execute on function public.get_reservation_availability(date, date) to anon, authenticated;
grant execute on function public.save_test_space_reservation(text, uuid, integer, date, time, time, text) to anon, authenticated;
grant execute on function public.save_test_equipment_reservation(text, uuid, text, date, time, time) to anon, authenticated;
grant execute on function public.cancel_test_reservation(text, uuid, text) to anon, authenticated;

-- Muestras para probar agenda y prestamos; se crean solo una vez.
insert into public.reservations (id, professor_code, space_id, reservation_date, start_time, end_time, reason)
values
  ('a81fd487-bc5c-4bb6-a2f7-07b5d6468620', '1001', 0, current_date + 7, time '09:00', time '11:00', 'Clase de prueba: conferencia'),
  ('68c4a4c2-9d82-4ba5-96a4-6c461f745b01', '1002', 1, current_date + 7, time '13:00', time '15:00', 'Clase de prueba: laboratorio')
on conflict (id) do update set
 professor_code = excluded.professor_code,
 space_id = excluded.space_id,
 reservation_date = excluded.reservation_date,
 start_time = excluded.start_time,
 end_time = excluded.end_time,
 reason = excluded.reason,
 status = 'confirmed';

insert into public.equipment_reservations (id, professor_code, equipment_id, reservation_date, start_time, end_time)
values
  ('5213e263-7540-44ca-9af3-4d2b6cb2fbc8', '1001', 'EQ-01', current_date + 7, time '09:00', time '11:00'),
  ('041b8a8b-c573-4fee-b2ae-e9fa9e816c0d', '1003', 'EQ-02', current_date + 7, time '10:00', time '12:00')
on conflict (id) do update set
 professor_code = excluded.professor_code,
 equipment_id = excluded.equipment_id,
 reservation_date = excluded.reservation_date,
 start_time = excluded.start_time,
 end_time = excluded.end_time,
 status = 'confirmed';

notify pgrst, 'reload schema';
