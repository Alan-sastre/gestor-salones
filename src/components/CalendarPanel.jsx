import { memo, useMemo } from 'react';
import { FaCheck } from 'react-icons/fa';

const DAY_START = 7 * 60;
const DAY_END = 21 * 60;
const DAY_MINUTES = DAY_END - DAY_START;

const toMinutes = (value) => {
  const [hours, minutes] = String(value || '').split(':').map(Number);
  if (!Number.isFinite(hours)) return null;
  return hours * 60 + (Number.isFinite(minutes) ? minutes : 0);
};

// Horas ocupadas del día, sin contar solapamientos entre reservas.
const occupiedMinutes = (items) => {
  const ranges = items
    .map((booking) => [toMinutes(booking.a), toMinutes(booking.b)])
    .filter(([start, end]) => start !== null && end !== null && end > start)
    .map(([start, end]) => [
      Math.min(Math.max(start, DAY_START), DAY_END),
      Math.min(Math.max(end, DAY_START), DAY_END),
    ])
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0]);

  let total = 0;
  let currentStart = null;
  let currentEnd = null;

  ranges.forEach(([start, end]) => {
    if (currentStart === null) {
      currentStart = start;
      currentEnd = end;
      return;
    }
    if (start <= currentEnd) {
      currentEnd = Math.max(currentEnd, end);
      return;
    }
    total += currentEnd - currentStart;
    currentStart = start;
    currentEnd = end;
  });

  if (currentStart !== null) total += currentEnd - currentStart;
  return total;
};

function CalendarPanel({
  currentMonth,
  selectedSpace,
  selectedDay,
  bookings,
  onMonthChange,
  onDateSelect,
  todayKey,
}) {
  const currentMonthLabel = currentMonth.toLocaleDateString('es', { month: 'long', year: 'numeric' });
  const statsByDate = useMemo(() => {
    const grouped = new Map();
    (bookings || []).forEach((booking) => {
      const list = grouped.get(booking.date) || [];
      list.push(booking);
      grouped.set(booking.date, list);
    });
    const stats = new Map();
    grouped.forEach((list, date) => {
      stats.set(date, { count: list.length, minutes: occupiedMinutes(list) });
    });
    return stats;
  }, [bookings]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const offset = (firstDay.getDay() + 6) % 7;
  const cells = [];

  for (let i = 0; i < offset; i += 1) {
    cells.push(<div key={`empty-${i}`} className="aspect-square rounded-2xl border border-transparent sm:h-20" />);
  }

  let fullDaysInMonth = 0;

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const stats = statsByDate.get(dateKey) || { count: 0, minutes: 0 };
    const bookingCount = stats.count;
    const hasBookings = bookingCount > 0;
    const isFull = stats.minutes >= DAY_MINUTES;
    if (isFull) fullDaysInMonth += 1;
    const isSelectedDay = dateKey === selectedDay;
    const isToday = dateKey === todayKey;
    const statusLabel = isFull
      ? 'sin horarios libres'
      : hasBookings
        ? `${bookingCount} reserva${bookingCount > 1 ? 's' : ''}`
        : 'libre';

    cells.push(
      <button
        key={dateKey}
        type="button"
        onClick={() => onDateSelect(dateKey)}
        aria-pressed={isSelectedDay}
        title={`${day} · ${statusLabel}`}
        aria-label={`${day} de ${currentMonthLabel}, ${statusLabel}${isSelectedDay ? ', seleccionado' : ''}`}
        className={[
          'group relative flex aspect-square flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border text-base transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 sm:h-20 sm:gap-1.5',
          isSelectedDay
            ? 'day-selected border-sky-400 ring-2 ring-sky-100 shadow-md'
            : isToday
              ? 'border-sky-200 hover:border-sky-300'
              : isFull
                ? 'border-slate-300'
                : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50',
          isFull
            ? 'day-full'
            : isSelectedDay
              ? 'bg-sky-100 hover:bg-sky-200'
              : isToday
                ? 'bg-sky-50 hover:bg-sky-100'
                : 'bg-white',
        ].join(' ')}
      >
        {isSelectedDay && (
          <span className="absolute right-1 top-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-sky-600 text-white shadow-sm">
            <FaCheck className="h-2 w-2" />
          </span>
        )}

        <span
          className={[
            'relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition duration-200',
            isSelectedDay
              ? isFull
                ? 'bg-white text-slate-500 shadow-sm'
                : 'bg-white text-sky-900 shadow-sm'
              : isFull
                ? 'text-slate-400'
                : 'text-slate-700 group-hover:bg-slate-100 group-hover:text-slate-900',
          ].join(' ')}
        >
          {day}
        </span>

        {isFull ? (
          <span className="hidden text-[10px] font-semibold text-slate-500 sm:block">Sin cupo</span>
        ) : hasBookings ? (
          <span className="hidden text-[10px] font-medium text-slate-500 sm:block">
            {bookingCount} reserva{bookingCount > 1 ? 's' : ''}
          </span>
        ) : null}

        {isToday && (
          <span className="text-[8px] font-semibold uppercase leading-none tracking-wide text-sky-500">Hoy</span>
        )}
      </button>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:col-span-2">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Calendario de</p>
          <h3 className="text-lg font-semibold text-slate-900">{selectedSpace.name}</h3>
          <p className="mt-0.5 text-xs text-slate-500">Incluye las reservas de todos los docentes</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onMonthChange(-1)}
            aria-label="Mes anterior"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 transition hover:bg-slate-100 active:scale-95"
          >
            &lsaquo;
          </button>
          <span className="w-36 text-center font-medium capitalize text-slate-700">{currentMonthLabel}</span>
          <button
            type="button"
            onClick={() => onMonthChange(1)}
            aria-label="Mes siguiente"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 transition hover:bg-slate-100 active:scale-95"
          >
            &rsaquo;
          </button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
        <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div>
      </div>

      <div key={currentMonthLabel} className="animate-fade-in grid grid-cols-7 gap-1.5 sm:gap-2">{cells}</div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <i className="inline-block h-2.5 w-2.5 rounded-full bg-sky-600" /> Seleccionado
        </span>
        <span className="flex items-center gap-1">
          <i className="inline-block h-2.5 w-2.5 rounded-full border border-sky-300 bg-sky-50" /> Hoy
        </span>
        {fullDaysInMonth > 0 && (
          <span className="flex items-center gap-1">
            <i className="day-full inline-block h-2.5 w-2.5 rounded-sm border border-slate-300" /> Sin cupo
          </span>
        )}
        <span className="text-slate-400">
          Un día con reservas todavía tiene horarios libres.
        </span>
      </div>
    </div>
  );
}

export default memo(CalendarPanel);
