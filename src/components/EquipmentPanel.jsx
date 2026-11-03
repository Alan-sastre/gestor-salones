import { useState } from 'react';
import { EQUIPMENT } from '../data/equipment';

const HOURS = Array.from({ length: 15 }, (_, i) => 7 + i);
const toHourValue = (hour) => `${String(hour).padStart(2, '0')}:00`;
const toHourLabel = (hour) => {
  const suffix = hour < 12 ? 'AM' : 'PM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:00 ${suffix}`;
};
const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const TYPE_BADGES = {
  Gafas: 'bg-cyan-100 text-cyan-700',
  impresora: 'bg-fuchsia-100 text-fuchsia-700',
  proyector: 'bg-sky-100 text-sky-700',
  microfono: 'bg-violet-100 text-violet-700',
  laptop: 'bg-emerald-100 text-emerald-700',
  camara: 'bg-amber-100 text-amber-700',
  cortadora: 'bg-orange-100 text-orange-700',
  pantalla: 'bg-teal-100 text-teal-700',
  lego: 'bg-lime-100 text-lime-700',
};
const TYPE_LABELS = {
  Gafas: 'Gafas VR',
  impresora: 'Impresora 3D',
  proyector: 'Proyector',
  microfono: 'Micrófono',
  laptop: 'Laptop',
  camara: 'Cámara',
  cortadora: 'Cortadora láser',
  pantalla: 'Pantalla',
  lego: 'LEGO',
};
const SPACE_NUMBERS = [501, 502, 503, 504];
const getSpaceNumber = (space) => Number(String(space?.name || '').match(/\b(501|502|503|504)\b/)?.[0]) || null;

export default function EquipmentPanel({
  equipment = EQUIPMENT,
  selectedSpace,
  selectedDay,
  equipmentBookings,
  onBookEquipment,
  onBack,
  onContinue,
  direction,
  isStandalone = false,
  onDayChange,
  onViewReservations,
}) {
  const [openId, setOpenId] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [lastBookedEquipment, setLastBookedEquipment] = useState(null);
  const [attemptedContinue, setAttemptedContinue] = useState(false);
  const [times, setTimes] = useState(() =>
    Object.fromEntries(equipment.map((eq) => [eq.id, { start: '07:00', end: '09:00' }]))
  );
  const [usability, setUsability] = useState({});
  const animClass = direction === 'back' ? 'step-enter-back' : 'step-enter';
  const todayValue = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  })();
  const selectedDayLabel = selectedDay
    ? (() => {
      const [year, month, day] = selectedDay.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString('es', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    })()
    : '';
  const selectedSpaceNumber = getSpaceNumber(selectedSpace);
  const roomEquipment = isStandalone
    ? equipment
    : equipment.filter((item) => item.spaceNumber === selectedSpaceNumber);

  const handleStartChange = (equipId, value) => {
    setTimes((prev) => {
      const index = HOURS.findIndex((h) => toHourValue(h) === value);
      const nextEndIndex = Math.min(index + 2, HOURS.length - 1);
      const newEnd = nextEndIndex > index ? toHourValue(HOURS[nextEndIndex]) : prev[equipId].end;
      return { ...prev, [equipId]: { start: value, end: newEnd } };
    });
  };

  const handleEndChange = (equipId, value) => {
    setTimes((prev) => ({ ...prev, [equipId]: { ...prev[equipId], end: value } }));
  };

  const handleBook = async (equipId) => {
    const { start, end } = times[equipId] || { start: '07:00', end: '09:00' };
    const equipmentItem = equipment.find((item) => item.id === equipId);
    const equipmentUsability = usability[equipId]?.trim() || '';
    if (timeToMinutes(start) >= timeToMinutes(end)) return;
    if (equipmentItem?.type === 'Gafas' && !equipmentUsability) return;
    setBookingId(equipId);
    setLastBookedEquipment(null);
    const saved = await onBookEquipment(equipId, start, end, selectedDay, equipmentUsability);
    if (saved) {
      setOpenId(null);
      setUsability((previous) => ({ ...previous, [equipId]: '' }));
      setLastBookedEquipment({
        name: equipmentItem?.name || 'Equipo',
        start,
        end,
        date: selectedDayLabel,
      });
    }
    setBookingId(null);
  };

  const handleContinue = () => {
    const openEquipment = equipment.find((item) => item.id === openId);
    if (openEquipment?.type === 'Gafas' && !usability[openId]?.trim()) {
      setAttemptedContinue(true);
      return;
    }
    onContinue?.();
  };

  return (
    <section className={`${animClass} rounded-3xl border border-slate-200 bg-white p-5 shadow-sm`}>
      {/* Back button removed — now in bottom nav row */}

      {isStandalone ? (
        <div className="mb-6 overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-indigo-50 shadow-sm">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Préstamo de equipos</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">Agenda de equipos</h2>
              <p className="mt-1 text-sm text-slate-500">
                Elige el equipo que necesitas y define el horario. La etiqueta de cada foto indica en qué salón se encuentra.
              </p>
            </div>
            <label className="block shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Fecha de préstamo
              <input
                type="date"
                min={todayValue}
                value={selectedDay || todayValue}
                onChange={(event) => {
                  onDayChange?.(event.target.value);
                  setLastBookedEquipment(null);
                }}
                className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal normal-case text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 sm:w-52"
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">¿Necesitas equipos?</h2>
          <p className="text-sm text-slate-500">
            Equipos disponibles para el salón {selectedSpaceNumber || 'seleccionado'}
          </p>
        </div>
      )}

      {!isStandalone && !selectedSpaceNumber ? (
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
          Selecciona un salón para consultar la disponibilidad de sus equipos.
        </p>
      ) : roomEquipment.length === 0 ? (
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
          No hay equipos registrados para el salón {selectedSpaceNumber}.
        </p>
      ) : (
        <>
        {isStandalone && (
          <div className="mb-3 flex items-center gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Elige el equipo y su horario</h3>
              <p className="text-xs capitalize text-slate-500">{selectedDayLabel}</p>
            </div>
          </div>
        )}
        {isStandalone && lastBookedEquipment && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 shadow-sm" role="status" aria-live="polite">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="m4 10 4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-bold">¡Préstamo registrado!</p>
              <p className="mt-0.5 text-sm">{lastBookedEquipment.name} · {lastBookedEquipment.start}–{lastBookedEquipment.end}</p>
              <p className="text-xs capitalize text-emerald-800">{lastBookedEquipment.date}. Solo reservaste el equipo, no el salón.</p>
            </div>
          </div>
        )}
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {roomEquipment.map((eq) => {
          const isOpen = openId === eq.id;
          const { start, end } = times[eq.id] || { start: '07:00', end: '09:00' };
          const dayBookings = (equipmentBookings[eq.id] || []).filter((booking) => booking.date === selectedDay);
          const events = dayBookings.flatMap((booking) => [
            { time: booking.a, change: 1 },
            { time: booking.b, change: -1 },
          ]).sort((first, second) => first.time.localeCompare(second.time) || first.change - second.change);
          let inUse = 0;
          let peakInUse = 0;
          events.forEach((event) => {
            inUse += event.change;
            peakInUse = Math.max(peakInUse, inUse);
          });
          const availableThatDay = Math.max(0, eq.total - peakInUse);
          const unitsInSelectedSlot = dayBookings.filter(
            (booking) => start < booking.b && end > booking.a
          ).length;
          const availableInSelectedSlot = Math.max(0, eq.total - unitsInSelectedSlot);

          return (
            <div
              key={eq.id}
              className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg"
            >
              {/* Header: name + type badge */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900">{eq.name}</h3>
                <span className={[
                  'flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold',
                  TYPE_BADGES[eq.type] || 'bg-slate-100 text-slate-600'
                ].join(' ')}>
                  {TYPE_LABELS[eq.type] || eq.type}
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">{eq.desc}</p>

              {eq.img && (
                <div className="aspect-video w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                  <img
                    src={eq.img}
                    alt={eq.name}
                    className="h-full w-full object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
              {isStandalone && eq.spaceNumber && (
                <p className="inline-flex items-center gap-1.5 self-start rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5 text-sky-600" aria-hidden="true">
                    <path d="M10 17s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" stroke="currentColor" strokeWidth="1.7" />
                    <circle cx="10" cy="7" r="2" stroke="currentColor" strokeWidth="1.7" />
                  </svg>
                  Salón {eq.spaceNumber}
                </p>
              )}

              {/* Availability indicator */}
              <div className={[
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold self-start',
                availableThatDay > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              ].join(' ')}>
                <span className={[
                  'h-2 w-2 rounded-full',
                  availableThatDay > 0 ? 'bg-emerald-500' : 'bg-amber-500'
                ].join(' ')} />
                Mín. {availableThatDay} de {eq.total} disponibles el día seleccionado
              </div>

              <div className="mt-auto pt-1">
                {!isOpen ? (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenId(eq.id);
                      setAttemptedContinue(false);
                    }}
                    className="w-full rounded-xl bg-sky-600 py-2 text-xs font-semibold text-white transition hover:bg-sky-700 active:scale-95"
                  >
                    Reservar
                  </button>
                ) : (
                  <div className="animate-fadeInUp space-y-2" style={{animationDuration: '250ms'}}>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Inicio</span>
                        <select
                          value={start}
                          onChange={(e) => handleStartChange(eq.id, e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        >
                          {HOURS.map((h) => (
                            <option key={`s-${eq.id}-${h}`} value={toHourValue(h)}>
                              {toHourLabel(h)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">Fin</span>
                        <select
                          value={end}
                          onChange={(e) => handleEndChange(eq.id, e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        >
                          {HOURS.map((h) => (
                            <option key={`e-${eq.id}-${h}`} value={toHourValue(h)}>
                              {toHourLabel(h)}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <p className={`text-[11px] font-medium ${availableInSelectedSlot > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {availableInSelectedSlot} de {eq.total} unidades disponibles en este horario
                    </p>
                    {eq.type === 'Gafas' && (
                      <label className="block text-xs font-semibold text-slate-600">
                        ¿Qué uso se les va a dar? <span className="text-rose-600">(obligatorio)</span>
                        <textarea
                          value={usability[eq.id] || ''}
                          onChange={(event) => setUsability((previous) => ({
                            ...previous,
                            [eq.id]: event.target.value,
                          }))}
                          maxLength={500}
                          required
                          aria-invalid={attemptedContinue && !usability[eq.id]?.trim()}
                          aria-describedby={attemptedContinue ? `usability-error-${eq.id}` : undefined}
                          rows={3}
                          placeholder="Describe brevemente la actividad o propósito"
                          className={`mt-1 w-full resize-y rounded-lg border bg-white px-3 py-2 text-xs font-normal text-slate-900 outline-none focus:ring-2 ${attemptedContinue && !usability[eq.id]?.trim() ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-sky-400 focus:ring-sky-100'}`}
                        />
                        {attemptedContinue && !usability[eq.id]?.trim() && (
                          <span id={`usability-error-${eq.id}`} className="mt-1 block font-medium text-rose-600" role="alert">
                            Describe el uso de las gafas antes de continuar.
                          </span>
                        )}
                      </label>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleBook(eq.id)}
                        disabled={timeToMinutes(start) >= timeToMinutes(end) || availableInSelectedSlot === 0 || bookingId === eq.id || (eq.type === 'Gafas' && !usability[eq.id]?.trim())}
                        className="flex-1 rounded-xl bg-sky-600 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {bookingId === eq.id ? 'Guardando…' : 'Confirmar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenId(null);
                          setAttemptedContinue(false);
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
          })}
        </div>
        </>
      )}

      {/* Navigation buttons */}
      {isStandalone ? (
        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            La reserva es únicamente del equipo; el salón indica dónde se encuentra.
          </p>
          {onViewReservations && (
            <button
              type="button"
              onClick={onViewReservations}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 active:scale-95"
            >
              Ver mis reservas
            </button>
          )}
        </div>
      ) : (
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Atrás
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 active:scale-95 shadow-sm"
          >
            Continuar
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}
    </section>
  );
}
