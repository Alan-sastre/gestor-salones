import { FaCalendarAlt, FaClock, FaRegCalendarTimes, FaTrashAlt, FaUser } from 'react-icons/fa';

const HOURS = Array.from({ length: 15 }, (_, i) => 7 + i); // 07:00 a 21:00

// "07:00" -> "7:00 AM"
const toHourValue = (hour) => `${String(hour).padStart(2, '0')}:00`;
const toHourLabel = (hour) => {
  const suffix = hour < 12 ? 'AM' : 'PM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:00 ${suffix}`;
};

// "14:00" -> "2:00 PM" (para mostrar las reservas guardadas)
const formatHour = (value) => {
  const hour = Number.parseInt(String(value || '').slice(0, 2), 10);
  const minutes = String(value || '').slice(3, 5) || '00';
  if (!Number.isFinite(hour)) return value;
  const suffix = hour < 12 ? 'AM' : 'PM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minutes} ${suffix}`;
};

export default function BookingPanel({
  dayTitle,
  selectedDateBookings,
  reason,
  startTime,
  endTime,
  message,
  onReasonChange,
  onStartTimeChange,
  onEndTimeChange,
  onBook,
  onCancelBooking,
}) {
  const startHour = Number.parseInt(startTime?.slice(0, 2), 10);
  const endHour = Number.parseInt(endTime?.slice(0, 2), 10);
  const startIndex = HOURS.indexOf(startHour);
  const endIndex = HOURS.indexOf(endHour);

  // Al elegir inicio, la reserva queda lista de a 2 horas automáticamente.
  const handleStartChange = (value) => {
    onStartTimeChange(value);

    const index = HOURS.findIndex((hour) => toHourValue(hour) === value);
    if (index < 0) return;

    const nextEndIndex = Math.min(index + 2, HOURS.length - 1);
    if (nextEndIndex <= index) return;

    onEndTimeChange(toHourValue(HOURS[nextEndIndex]));
  };

  const durationHours = endIndex - startIndex;

  return (
    <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div>
        <div className="mb-2 flex items-center gap-2 text-slate-700">
          <FaCalendarAlt className="text-sky-600" />
          <h3 className="font-semibold capitalize text-slate-900">{dayTitle}</h3>
        </div>

        <ul className="mt-3 space-y-3 text-sm">
          {selectedDateBookings.length > 0 ? (
            selectedDateBookings
              .slice()
              .sort((a, b) => a.a.localeCompare(b.a))
              .map((booking) => (
                <li key={booking.id || `${booking.date}-${booking.a}-${booking.b}`} className="overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white shadow-sm">
                  <div className="flex items-stretch">
                    <div className="flex min-w-[5.5rem] flex-col items-center justify-center bg-sky-600 px-3 py-3 text-center text-white">
                      <FaClock className="mb-1 text-sm opacity-80" />
                      <span className="text-sm font-bold leading-tight">{formatHour(booking.a)}</span>
                      <span className="my-0.5 text-xs opacity-70">hasta</span>
                      <span className="text-sm font-bold leading-tight">{formatHour(booking.b)}</span>
                    </div>
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-2 p-3">
                      <div className="min-w-0">
                        <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-sky-800">
                          {booking.owned ? 'Tu reserva' : 'Otro docente'}
                        </span>
                        <p className="mt-1.5 break-words text-sm font-semibold leading-snug text-slate-800">
                          {booking.r || (booking.owned ? 'Horario reservado' : 'Reserva de otro docente')}
                        </p>
                        {!booking.owned && booking.t && booking.t !== 'Otro docente' && (
                          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500">
                            <FaUser className="text-[10px]" />
                            {booking.t}
                          </p>
                        )}
                      </div>
                      {booking.owned && (
                        <button
                          type="button"
                          onClick={() => onCancelBooking(booking.id)}
                          aria-label="Cancelar reserva"
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50"
                        >
                          <FaTrashAlt className="text-[10px]" />
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))
          ) : (
            <li className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              Sin reservas: el día está libre.
            </li>
          )}
        </ul>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <div className="mb-3 flex items-center gap-2 text-slate-800">
          <FaRegCalendarTimes className="text-sky-600" />
          <h3 className="font-semibold text-slate-900">Reservar este espacio</h3>
        </div>

        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              Escuela <span className="text-rose-600">*</span>
            </span>
            <input
              type="text"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              required
              aria-required="true"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-3 focus:ring-sky-100"
              placeholder="Escribe el nombre de la escuela"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                <FaClock className="text-sky-600" /> Inicio
              </span>
              <select
                value={startTime}
                onChange={(e) => handleStartChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-3 focus:ring-sky-100"
              >
                {HOURS.map((hour) => (
                  <option key={`start-${hour}`} value={toHourValue(hour)}>{toHourLabel(hour)}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                <FaClock className="text-sky-600" /> Fin
              </span>
              <select
                value={endTime}
                onChange={(e) => onEndTimeChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-sky-400 focus:ring-3 focus:ring-sky-100"
              >
                {HOURS.map((hour) => (
                  <option key={`end-${hour}`} value={toHourValue(hour)}>{toHourLabel(hour)}</option>
                ))}
              </select>
            </label>
          </div>

          <p className="text-xs text-slate-500">
            Duración: <span className="font-semibold text-slate-700">{durationHours > 0 ? `${durationHours} h` : '—'}</span>
          </p>

          <button
            type="button"
            onClick={onBook}
            className="w-full rounded-xl bg-sky-600 py-2.5 font-medium text-white transition hover:bg-sky-700"
          >
            Agendar
          </button>

          <p className={['min-h-4 text-xs', message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'].join(' ')}>
            {message.text}
          </p>
        </div>
      </div>
    </aside>
  );
}
