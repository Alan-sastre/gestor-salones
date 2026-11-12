import { useEffect, useMemo } from 'react';
import { FaCalendarAlt, FaClock, FaRegCalendarTimes, FaTrashAlt, FaUser } from 'react-icons/fa';
import { EQUIPMENT } from '../data/equipment';

const HOURS = Array.from({ length: 15 }, (_, i) => 7 + i); // 07:00 a 21:00
const DAY_START = 7 * 60;
const DAY_END = 21 * 60;
const DAY_MINUTES = DAY_END - DAY_START;
const SLOT_HOURS = 2;

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

const toMinutes = (value) => {
  const [hours, minutes] = String(value || '').split(':').map(Number);
  if (!Number.isFinite(hours)) return Number.NaN;
  return hours * 60 + (Number.isFinite(minutes) ? minutes : 0);
};

const toTimeLabel = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const formatFreeTime = (minutes) => {
  if (minutes <= 0) return 'Sin horarios libres';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min libres`;
  return rest ? `${hours} h ${rest} min libres` : `${hours} h libres`;
};

export default function BookingPanel({
  dayTitle,
  selectedDateBookings,
  equipmentAvailability,
  equipment = EQUIPMENT,
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
  const occupied = useMemo(
    () =>
      (selectedDateBookings || [])
        .map((booking) => ({
          id: booking.id || `${booking.date}-${booking.a}-${booking.b}`,
          start: toMinutes(booking.a),
          end: toMinutes(booking.b),
          owned: Boolean(booking.owned),
          label: booking.owned ? 'Tu reserva' : booking.t || 'Otro docente',
        }))
        .filter((item) => Number.isFinite(item.start) && Number.isFinite(item.end) && item.end > item.start)
        .map((item) => ({
          ...item,
          start: clamp(item.start, DAY_START, DAY_END),
          end: clamp(item.end, DAY_START, DAY_END),
        }))
        .filter((item) => item.end > item.start),
    [selectedDateBookings],
  );

  // Minutos ocupados sin contar solapamientos entre reservas.
  const occupiedMinutes = useMemo(() => {
    const ranges = occupied
      .map((item) => [item.start, item.end])
      .sort((a, b) => a[0] - b[0]);
    let total = 0;
    let currentStart = null;
    let currentEnd = null;
    ranges.forEach(([rangeStart, rangeEnd]) => {
      if (currentStart === null) {
        currentStart = rangeStart;
        currentEnd = rangeEnd;
        return;
      }
      if (rangeStart <= currentEnd) {
        currentEnd = Math.max(currentEnd, rangeEnd);
        return;
      }
      total += currentEnd - currentStart;
      currentStart = rangeStart;
      currentEnd = rangeEnd;
    });
    if (currentStart !== null) total += currentEnd - currentStart;
    return total;
  }, [occupied]);

  const freeMinutes = Math.max(0, DAY_MINUTES - occupiedMinutes);
  const hasOthers = occupied.some((item) => !item.owned);

  // Build a map of professor email -> equipment names for the selected day.
  const equipmentByProfessor = useMemo(() => {
    const map = new Map();
    if (!equipmentAvailability) return map;
    const selectedDayFromBookings = selectedDateBookings[0]?.date;
    if (!selectedDayFromBookings) return map;
    Object.values(equipmentAvailability).forEach((bookingList) => {
      (bookingList || []).forEach((booking) => {
        if (booking.date !== selectedDayFromBookings) return;
        const eq = equipment.find((e) => String(e.id) === String(booking.resourceId));
        if (!eq) return;
        const eqName = eq.spaceNumber ? `${eq.name} (Salón ${eq.spaceNumber})` : eq.name;
        const email = booking.professorEmail || booking.professorName;
        if (!email) return;
        if (!map.has(email)) map.set(email, new Set());
        map.get(email).add(eqName);
      });
    });
    return map;
  }, [equipmentAvailability, equipment, selectedDateBookings]);

  const isStartBlocked = (value) => {
    const time = toMinutes(value);
    if (!Number.isFinite(time)) return false;
    return occupied.some((item) => time >= item.start && time < item.end);
  };

  // Como el rango es [inicio, fin), terminar justo cuando empieza otra reserva es válido.
  const isEndBlocked = (value) => {
    const time = toMinutes(value);
    if (!Number.isFinite(time)) return false;
    return occupied.some((item) => time > item.start && time < item.end);
  };

  const rangeStart = toMinutes(startTime);
  const rangeEnd = toMinutes(endTime);
  const hasRange = Number.isFinite(rangeStart) && Number.isFinite(rangeEnd) && rangeEnd > rangeStart;
  const hasConflict =
    hasRange && occupied.some((item) => rangeStart < item.end && rangeEnd > item.start);

  // Si al cambiar de día la hora de inicio queda ocupada, saltamos al primer hueco de 2 h.
  useEffect(() => {
    if (occupied.length === 0) return;
    const start = toMinutes(startTime);
    if (!Number.isFinite(start)) return;
    if (!occupied.some((item) => start >= item.start && start < item.end)) return;
    const isFree = (from, to) => !occupied.some((item) => from < item.end && to > item.start);
    const nextStart = HOURS.filter((hour) => hour + SLOT_HOURS <= 21).find((hour) =>
      isFree(toMinutes(toHourValue(hour)), toMinutes(toHourValue(hour + SLOT_HOURS))),
    );
    if (nextStart === undefined) return;
    onStartTimeChange(toHourValue(nextStart));
    onEndTimeChange(toHourValue(nextStart + SLOT_HOURS));
  }, [occupied, startTime, onStartTimeChange, onEndTimeChange]);

  // Al elegir inicio, la reserva queda lista de a 2 horas automáticamente.
  const handleStartChange = (value) => {
    onStartTimeChange(value);

    const index = HOURS.findIndex((hour) => toHourValue(hour) === value);
    if (index < 0) return;

    const nextEndIndex = Math.min(index + SLOT_HOURS, HOURS.length - 1);
    if (nextEndIndex <= index) return;

    onEndTimeChange(toHourValue(HOURS[nextEndIndex]));
  };

  const durationHours = (rangeEnd - rangeStart) / 60;

  const percent = (minutes) => ((minutes - DAY_START) / DAY_MINUTES) * 100;
  const selectionStyle = hasRange
    ? {
        left: `${percent(clamp(rangeStart, DAY_START, DAY_END))}%`,
        width: `${percent(clamp(rangeEnd, DAY_START, DAY_END)) - percent(clamp(rangeStart, DAY_START, DAY_END))}%`,
      }
    : null;

  return (
    <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div>
        <div className="mb-3 flex items-center gap-2 text-slate-700">
          <FaCalendarAlt className="text-sky-600" />
          <h3 className="font-semibold capitalize text-slate-900">{dayTitle}</h3>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Disponibilidad del día
          </p>

          <div
            className="relative h-7 w-full overflow-hidden rounded-lg bg-slate-200"
            role="img"
            aria-label={`Horarios ocupados de 07:00 a 21:00. ${formatFreeTime(freeMinutes)}.`}
          >
            {selectionStyle && (
              <div
                className="absolute inset-y-0 bg-sky-200/70"
                style={selectionStyle}
              />
            )}

            {[7, 11, 15, 19].map((hour) => (
              <span
                key={`tick-${hour}`}
                aria-hidden="true"
                className="absolute inset-y-0 border-l border-white/70"
                style={{ left: `${percent(hour * 60)}%` }}
              />
            ))}

            {occupied.map((item) => (
              <div
                key={item.id}
                title={`${item.label} · ${formatHour(toTimeLabel(item.start))} a ${formatHour(toTimeLabel(item.end))}`}
                className={[
                  'absolute inset-y-0 transition',
                  item.owned ? 'bg-sky-600' : 'bg-slate-400',
                ].join(' ')}
                style={{
                  left: `${percent(item.start)}%`,
                  width: `${Math.max(percent(item.end) - percent(item.start), 0.7)}%`,
                }}
              />
            ))}
          </div>

          <div className="relative mt-1 h-3 text-[9px] text-slate-400">
            {[7, 10, 13, 16, 19].map((hour) => (
              <span
                key={`label-${hour}`}
                className={[
                  'absolute whitespace-nowrap',
                  hour === 7 ? '' : '-translate-x-1/2',
                ].join(' ')}
                style={{ left: `${percent(hour * 60)}%` }}
              >
                {toHourLabel(hour)}
              </span>
            ))}
            <span className="absolute right-0 whitespace-nowrap">9:00 PM</span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <i className="inline-block h-2 w-2 rounded-sm bg-sky-600" /> Tu reserva
            </span>
            {hasOthers && (
              <span className="flex items-center gap-1">
                <i className="inline-block h-2 w-2 rounded-sm bg-slate-400" /> Otro docente
              </span>
            )}
            <span className="flex items-center gap-1">
              <i className="inline-block h-2 w-2 rounded-sm bg-slate-200" /> Disponible
            </span>
            <span className="ml-auto font-medium text-slate-600">{formatFreeTime(freeMinutes)}</span>
          </div>
        </div>

        <ul className="mt-3 space-y-3 text-sm">
          {selectedDateBookings.length > 0 ? (
            selectedDateBookings
              .slice()
              .sort((a, b) => a.a.localeCompare(b.a))
              .map((booking) => (
                <li
                  key={booking.id || `${booking.date}-${booking.a}-${booking.b}`}
                  className={[
                    'overflow-hidden rounded-2xl border shadow-sm',
                    booking.owned ? 'border-sky-100 bg-sky-50/60' : 'border-slate-200 bg-white',
                  ].join(' ')}
                >
                  <div className="flex flex-col sm:flex-row sm:items-stretch">
                    <div
                      className={[
                        'flex items-center justify-center gap-2 px-3 py-2.5 text-center text-white sm:flex-col sm:px-4 sm:py-3',
                        booking.owned ? 'bg-sky-600' : 'bg-slate-500',
                      ].join(' ')}
                    >
                      <FaClock className="shrink-0 text-sm opacity-80" />
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold leading-tight">{formatHour(booking.a)}</span>
                        <span className="my-0.5 text-xs opacity-70">hasta</span>
                        <span className="text-sm font-bold leading-tight">{formatHour(booking.b)}</span>
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-2 p-3 sm:flex-row">
                      <div className="min-w-0">
                        <span
                          className={[
                            'inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                            booking.owned ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-600',
                          ].join(' ')}
                        >
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
                        {!booking.owned && booking.professorEmail && equipmentByProfessor.has(booking.professorEmail) && (
                          <p className="mt-1 text-xs font-medium text-slate-500">
                            <span className="mr-1">🔧</span>
                            {Array.from(equipmentByProfessor.get(booking.professorEmail)).join(', ')}
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
                {HOURS.map((hour) => {
                  const value = toHourValue(hour);
                  const blocked = isStartBlocked(value);
                  return (
                    <option key={`start-${hour}`} value={value} disabled={blocked}>
                      {toHourLabel(hour)}
                      {blocked ? ' · ocupado' : ''}
                    </option>
                  );
                })}
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
                {HOURS.map((hour) => {
                  const value = toHourValue(hour);
                  const blocked = isEndBlocked(value);
                  return (
                    <option key={`end-${hour}`} value={value} disabled={blocked}>
                      {toHourLabel(hour)}
                      {blocked ? ' · ocupado' : ''}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>

          <p className="text-xs text-slate-500">
            Duración: <span className="font-semibold text-slate-700">{durationHours > 0 ? `${durationHours} h` : '—'}</span>
          </p>

          {hasConflict && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              Ese horario ya está reservado. Elige otro tramo disponible.
            </p>
          )}

          <button
            type="button"
            onClick={onBook}
            disabled={hasConflict}
            className="w-full rounded-xl bg-sky-600 py-2.5 font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
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
