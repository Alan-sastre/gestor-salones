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
  proyector: 'bg-sky-100 text-sky-700',
  microfono: 'bg-violet-100 text-violet-700',
  laptop: 'bg-emerald-100 text-emerald-700',
  camara: 'bg-amber-100 text-amber-700',
};
const TYPE_LABELS = {
  proyector: 'Proyector',
  microfono: 'Micrófono',
  laptop: 'Laptop',
  camara: 'Cámara',
};

export default function EquipmentPanel({ selectedDay, equipmentBookings, onBookEquipment, onBack, onContinue, direction }) {
  const [openId, setOpenId] = useState(null);
  const [times, setTimes] = useState(() =>
    Object.fromEntries(EQUIPMENT.map((eq) => [eq.id, { start: '07:00', end: '09:00' }]))
  );
  const animClass = direction === 'back' ? 'step-enter-back' : 'step-enter';

  const bookedCountOnDay = (equipId, total) => {
    const dayBookings = (equipmentBookings[equipId] || []).filter((b) => b.date === selectedDay);
    return Math.min(dayBookings.length, total);
  };

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

  const handleBook = (equipId) => {
    const { start, end } = times[equipId] || { start: '07:00', end: '09:00' };
    if (timeToMinutes(start) >= timeToMinutes(end)) return;
    onBookEquipment(equipId, start, end);
    setOpenId(null);
  };

  return (
    <section className={`${animClass} rounded-3xl border border-slate-200 bg-white p-5 shadow-sm`}>
      {/* Back button removed — now in bottom nav row */}

      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">¿Necesitas equipos?</h2>
        <p className="text-sm text-slate-500">Reserva equipos adicionales para tu clase</p>
      </div>

      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {EQUIPMENT.map((eq) => {
          const booked = bookedCountOnDay(eq.id, eq.total);
          const available = eq.total - booked;
          const isAvailable = available > 0;
          const isOpen = openId === eq.id;
          const { start, end } = times[eq.id] || { start: '07:00', end: '09:00' };

          return (
            <div
              key={eq.id}
              className="rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col p-4 gap-2"
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

              {/* Availability indicator */}
              <div className={[
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold self-start',
                isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              ].join(' ')}>
                <span className={[
                  'h-2 w-2 rounded-full',
                  isAvailable ? 'bg-emerald-500' : 'bg-rose-500'
                ].join(' ')} />
                {isAvailable ? `${available} de ${eq.total} disponibles hoy` : 'No disponible'}
              </div>

              <div className="mt-auto pt-1">
                {!isOpen ? (
                  <button
                    type="button"
                    onClick={() => isAvailable && setOpenId(eq.id)}
                    disabled={!isAvailable}
                    className={[
                      'w-full rounded-xl py-2 text-xs font-semibold transition',
                      isAvailable
                        ? 'bg-sky-600 text-white hover:bg-sky-700 active:scale-95'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    ].join(' ')}
                  >
                    {isAvailable ? 'Reservar' : 'No disponible'}
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
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleBook(eq.id)}
                        disabled={timeToMinutes(start) >= timeToMinutes(end)}
                        className="flex-1 rounded-xl bg-sky-600 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Confirmar
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenId(null)}
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

      {/* Navigation buttons */}
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
          onClick={onContinue}
          className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 active:scale-95 shadow-sm"
        >
          Continuar
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </section>
  );
}
