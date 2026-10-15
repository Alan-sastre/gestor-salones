import { EQUIPMENT } from '../data/equipment';

export default function BookingSummaryScreen({
  direction,
  userName,
  space,
  selectedDay,
  startTime,
  endTime,
  reason,
  equipmentBookings,
  onEditSpace,
  onEditCalendar,
  onEditEquipment,
  onConfirm,
  onBack,
}) {
  const animClass = direction === 'back' ? 'step-enter-back' : 'step-enter';

  // Parse date without timezone issues
  const [year, month, day] = selectedDay.split('-').map(Number);
  const formattedDate = new Date(year, month - 1, day).toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Collect equipment booked for selectedDay
  const bookedEquipment = Object.entries(equipmentBookings).flatMap(([equipId, bookingList]) => {
    const dayBookings = bookingList.filter((b) => b.date === selectedDay);
    if (dayBookings.length === 0) return [];
    const eq = EQUIPMENT.find((e) => e.id === equipId);
    return dayBookings.map((b) => ({
      name: eq ? eq.name : equipId,
      a: b.a,
      b: b.b,
    }));
  });

  return (
    <div className={`${animClass} mx-auto max-w-2xl`}>
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Resumen de tu reserva</h1>
        <p className="mt-1 text-sm text-slate-500">Revisa los detalles antes de confirmar</p>
      </div>

      {/* Main card */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">

        {/* Section 1 — Professor */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👤</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Docente</p>
              <p className="text-sm font-semibold text-slate-900">{userName}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Section 2 — Space */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏫</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Salón</p>
              <p className="text-sm font-semibold text-slate-900">{space?.name}</p>
              {space?.capacidad && (
                <span className="mt-1 inline-block rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                  Capacidad: {space.capacidad}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onEditSpace}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95"
          >
            Cambiar
          </button>
        </div>

        <div className="border-t border-slate-100" />

        {/* Section 3 — Date and time */}
        <div className="flex items-start justify-between px-6 py-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Fecha</p>
                <p className="text-sm font-semibold text-slate-900 capitalize">{formattedDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🕐</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Horario</p>
                <p className="text-sm font-semibold text-slate-900">{startTime} – {endTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Motivo</p>
                <p className="text-sm font-semibold text-slate-900">{reason || <span className="text-slate-400">(sin motivo especificado)</span>}</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onEditCalendar}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95"
          >
            Cambiar
          </button>
        </div>

        <div className="border-t border-slate-100" />

        {/* Section 4 — Equipment */}
        <div className="flex items-start justify-between px-6 py-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔧</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Equipos reservados</p>
              {bookedEquipment.length === 0 ? (
                <p className="text-sm text-slate-400">Ninguno</p>
              ) : (
                <ul className="mt-1 space-y-1">
                  {bookedEquipment.map((item, idx) => (
                    <li key={idx} className="text-sm font-semibold text-slate-900">
                      {item.name} — {item.a} – {item.b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onEditEquipment}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95"
          >
            Cambiar
          </button>
        </div>
      </div>

      {/* Action buttons */}
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
          onClick={onConfirm}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          Confirmar reserva
        </button>
      </div>
    </div>
  );
}
