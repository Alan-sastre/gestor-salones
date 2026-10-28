import { useState } from 'react';
import { FaCalendarAlt, FaEdit, FaImage, FaTrashAlt } from 'react-icons/fa';
import { EQUIPMENT } from '../data/equipment';
import { SPACES } from '../data/spaces';

const HOURS = Array.from({ length: 15 }, (_, index) => `${String(index + 7).padStart(2, '0')}:00`);

function formatDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ReservationsPanel({
  reservations,
  spaces = SPACES,
  equipment = EQUIPMENT,
  onUpdate,
  onCancel,
  loading,
}) {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(null);

  const reservationGroups = ['space', 'equipment'].map((kind) => {
    const matchingReservations = reservations.filter((reservation) => reservation.kind === kind);
    const dates = matchingReservations.reduce((groups, reservation) => {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.date === reservation.date) {
        lastGroup.items.push(reservation);
      } else {
        groups.push({ date: reservation.date, items: [reservation] });
      }
      return groups;
    }, []);

    return {
      kind,
      label: kind === 'space' ? 'Espacios reservados' : 'Equipos reservados',
      dates,
      count: matchingReservations.length,
    };
  });

  const beginEdit = (reservation) => {
    setEditingId(`${reservation.kind}-${reservation.id}`);
    setForm({
      date: reservation.date,
      start: reservation.start,
      end: reservation.end,
      reason: reservation.reason || '',
      usability: reservation.usability || '',
      resourceId: String(reservation.resourceId),
    });
  };

  const save = async (reservation) => {
    if (!form || !form.date || form.start >= form.end) return;
    if (reservation.kind === 'space' && !form.reason.trim()) return;
    const selectedEquipment = equipment.find((item) => item.id === form.resourceId);
    if (reservation.kind === 'equipment' && selectedEquipment?.type === 'Gafas' && !form.usability.trim()) return;
    const succeeded = await onUpdate(reservation, form);
    if (succeeded) {
      setEditingId(null);
      setForm(null);
    }
  };

  return (
    <section className="animate-fade-in rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-sky-700">Tu agenda</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Tus reservas</h2>
          <p className="mt-1 text-sm text-slate-500">Edita los datos o cancela tus reservas.</p>
        </div>
        <span className="rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800">
          {reservations.length} {reservations.length === 1 ? 'reserva' : 'reservas'}
        </span>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">Cargando tus reservas…</div>
      ) : reservations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-10 text-center">
          <FaCalendarAlt className="mx-auto mb-3 text-3xl text-sky-500" />
          <p className="font-semibold text-slate-800">Todavía no tienes reservas</p>
          <p className="mt-1 text-sm text-slate-500">Tus próximas reservas aparecerán aquí.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {reservationGroups.map((group) => (
            <section key={group.kind} aria-label={group.label}>
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <h3 className="text-lg font-bold text-slate-900">{group.label}</h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {group.count}
                </span>
              </div>
              {group.count === 0 ? (
                <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  No tienes {group.kind === 'space' ? 'espacios' : 'equipos'} reservados.
                </p>
              ) : (
                <div className="space-y-5">
                  {group.dates.map(({ date, items }) => (
                    <div key={date}>
                      <h4 className="mb-3 text-sm font-semibold capitalize text-slate-600">{formatDate(date)}</h4>
                      <div className="grid gap-4 lg:grid-cols-2">
                        {items.map((reservation) => {
                          const reservationKey = `${reservation.kind}-${reservation.id}`;
                          const editing = editingId === reservationKey;
                          const resource = reservation.kind === 'space'
                            ? spaces.find((item) => item.id === Number(reservation.resourceId))
                            : equipment.find((item) => item.id === reservation.resourceId);
                          const resourceOptions = reservation.kind === 'space'
                            ? spaces
                            : equipment.filter((item) => item.spaceNumber === resource?.spaceNumber);
                          const resourceName = reservation.kind === 'equipment' && resource?.spaceNumber
                            ? `${resource.name} · Salón ${resource.spaceNumber}`
                            : resource?.name;
                          const resourceImage = resource?.img;
                          const resourceMeta = reservation.kind === 'space'
                            ? (resource?.capacidad ? `Capacidad: ${resource.capacidad} personas` : null)
                            : (resource?.total ? `${resource.total} ${resource.total === 1 ? 'unidad disponible' : 'unidades disponibles'}` : null);

                          return (
                            <article
                              key={reservationKey}
                              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                            >
                              {editing && form ? (
                                <div className="space-y-3">
                                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    {reservation.kind === 'space' ? 'Espacio' : 'Equipo'}
                                    <select
                                      value={form.resourceId}
                                      onChange={(event) => setForm({ ...form, resourceId: event.target.value })}
                                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-800"
                                    >
                                      {resourceOptions.map((item) => (
                                        <option key={item.id} value={item.id}>
                                          {item.name}{reservation.kind === 'equipment' && item.spaceNumber ? ` · Salón ${item.spaceNumber}` : ''}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Fecha
                                    <input
                                      type="date"
                                      min={new Date().toISOString().slice(0, 10)}
                                      required
                                      value={form.date}
                                      onChange={(event) => setForm({ ...form, date: event.target.value })}
                                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal normal-case text-slate-800"
                                    />
                                  </label>
                                  <div className="grid grid-cols-2 gap-3">
                                    {['start', 'end'].map((field) => (
                                      <label key={field} className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        {field === 'start' ? 'Inicio' : 'Fin'}
                                        <select
                                          value={form[field]}
                                          onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal normal-case text-slate-800"
                                        >
                                          {HOURS.map((hour) => <option key={hour} value={hour}>{hour}</option>)}
                                        </select>
                                      </label>
                                    ))}
                                  </div>
                                  {reservation.kind === 'space' && (
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      Escuela <span className="text-rose-600">*</span>
                                      <input
                                        value={form.reason}
                                        onChange={(event) => setForm({ ...form, reason: event.target.value })}
                                        required
                                        aria-required="true"
                                        maxLength={160}
                                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal normal-case text-slate-800"
                                      />
                                    </label>
                                  )}
                                  {reservation.kind === 'equipment' && equipment.find((item) => item.id === form.resourceId)?.type === 'Gafas' && (
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      Uso de las gafas
                                      <textarea
                                        value={form.usability}
                                        onChange={(event) => setForm({ ...form, usability: event.target.value })}
                                        maxLength={500}
                                        required
                                        rows={3}
                                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal normal-case text-slate-800"
                                      />
                                    </label>
                                  )}
                                  <div className="flex gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => save(reservation)}
                                      disabled={!form.date || form.start >= form.end || (reservation.kind === 'space' && !form.reason.trim())}
                                      className="flex-1 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      Guardar cambios
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setEditingId(null); setForm(null); }}
                                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-start gap-3 sm:gap-4">
                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 sm:h-24 sm:w-24">
                                      {resourceImage ? (
                                        <img
                                          src={resourceImage}
                                          alt={resourceName || 'Recurso reservado'}
                                          className={`h-full w-full ${reservation.kind === 'space' ? 'object-cover' : 'object-contain'}`}
                                          loading="lazy"
                                          decoding="async"
                                        />
                                      ) : (
                                        <FaImage className="text-2xl text-slate-300" aria-hidden="true" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-start justify-between gap-2">
                                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${reservation.kind === 'space' ? 'bg-sky-100 text-sky-800' : 'bg-violet-100 text-violet-800'}`}>
                                          {reservation.kind === 'space' ? 'Espacio' : 'Equipo'}
                                        </span>
                                        <span className="whitespace-nowrap rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                                          {reservation.start} – {reservation.end}
                                        </span>
                                      </div>
                                      <h3 className="mt-2 text-lg font-bold leading-tight text-slate-900">
                                        {resourceName || 'Elemento reservado'}
                                      </h3>
                                      {resourceMeta && (
                                        <p className="mt-1 text-xs font-medium text-slate-500">{resourceMeta}</p>
                                      )}
                                      {reservation.usability && (
                                        <p className="mt-1 text-sm text-slate-500"><span className="font-semibold">Uso:</span> {reservation.usability}</p>
                                      )}
                                      {reservation.reason && (
                                        <p className="mt-1 text-sm text-slate-500">{reservation.reason}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                                    <button
                                      type="button"
                                      onClick={() => beginEdit(reservation)}
                                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
                                    >
                                      <FaEdit /> Editar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onCancel(reservation)}
                                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                                    >
                                      <FaTrashAlt /> Cancelar reserva
                                    </button>
                                  </div>
                                </>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
