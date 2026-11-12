-- Registra el Auditorio y Varon del Sol, y asigna equipos a cada salón.
-- Ejecuta este script en el SQL Editor de Supabase una sola vez.

insert into public.spaces (id, name, capacity, description)
values
  (4, 'Auditorio', 100, 'Espacio amplio para eventos, conferencias y actividades académicas.'),
  (5, 'Varon del Sol', 30, 'Espacio disponible para actividades académicas y reuniones.')
on conflict (id) do update
set name = excluded.name,
    capacity = excluded.capacity,
    description = excluded.description;

alter table public.equipment
  add column if not exists space_number integer;

insert into public.equipment (id, name, type, description, total_units, space_number)
values
  ('EQ-01', 'Gafas de Realidad Virtual', 'Gafas', 'Gafas de realidad virtual con pantalla de alta resolución y sensores de movimiento.', 5, 502),
  ('EQ-02', 'Impresora 3D', 'impresora', 'Impresora 3D de alto rendimiento con capacidad de impresión en 3D de alta calidad.', 2, 502),
  ('EQ-03', 'Cortadora láser', 'cortadora', 'Máquina de corte láser con precisión y eficiencia para trabajos de diseño y prototipado.', 2, 502),
  ('EQ-04', 'Pantalla Inteligente', 'pantalla', 'Pantalla inteligente con tecnología de visualización avanzada y conectividad inalámbrica.', 1, 501),
  ('EQ-501-LEGO', 'Kit LEGO educativo', 'lego', 'Kit de piezas LEGO para actividades educativas de construcción y robótica.', 1, 501),
  ('EQ-503-LEGO', 'Kit LEGO educativo', 'lego', 'Kit de piezas LEGO para actividades educativas de construcción y robótica.', 1, 503),
  ('EQ-503-PANTALLA', 'Pantalla Inteligente', 'pantalla', 'Pantalla inteligente con tecnología de visualización avanzada y conectividad inalámbrica.', 1, 503),
  ('EQ-504-PANTALLA', 'Pantalla Inteligente', 'pantalla', 'Pantalla inteligente con tecnología de visualización avanzada y conectividad inalámbrica.', 1, 504),
  ('EQ-505-PANTALLA', 'Pantalla', 'pantalla', 'Pantalla disponible para uso en el auditorio.', 1, 505),
  ('EQ-505-MICROFONO', 'Micrófono', 'microfono', 'Micrófono disponible para uso en el auditorio.', 1, 505),
  ('EQ-505-PROYECTOR', 'Proyector', 'proyector', 'Proyector disponible para uso en el auditorio.', 1, 505)
on conflict (id) do update
set name = excluded.name,
    type = excluded.type,
    description = excluded.description,
    total_units = excluded.total_units,
    space_number = excluded.space_number;

notify pgrst, 'reload schema';
