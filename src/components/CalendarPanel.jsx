import { memo, useMemo } from 'react';
import { FaCheck } from 'react-icons/fa';

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
  const bookingsByDate = useMemo(() => {
    const grouped = new Map();
    (bookings || []).forEach((booking) => {
      grouped.set(booking.date, (grouped.get(booking.date) || 0) + 1);
    });
    return grouped;
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

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const bookingCount = bookingsByDate.get(dateKey) || 0;
    const hasBookings = bookingCount > 0;
    const isSelectedDay = dateKey === selectedDay;
    const isToday = dateKey === todayKey;

    cells.push(
      <button
        key={dateKey}
        type="button"
        onClick={() => onDateSelect(dateKey)}
        aria-pressed={isSelectedDay}
        title={
          hasBookings
            ? `${day} · ${bookingCount} reserva${bookingCount > 1 ? 's' : ''}`
            : `${day} · libre`
        }
        aria-label={`${day} de ${currentMonthLabel}${hasBookings ? `, ${bookingCount} reserva${bookingCount > 1 ? 's' : ''}` : ', libre'}${isSelectedDay ? ', seleccionado' : ''}`}
        className={[
          'group relative flex aspect-square flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border text-base transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 sm:h-20 sm:gap-1.5',
          isSelectedDay
            ? `day-selected border-sky-400 ${hasBookings ? 'bg-rose-50 hover:bg-rose-100' : 'bg-sky-100 hover:bg-sky-200'} ring-2 ring-sky-100 shadow-md`
            : hasBookings
              ? 'border-rose-200 bg-rose-50 hover:border-rose-300 hover:bg-rose-100'
              : isToday
                ? 'border-sky-200 bg-sky-50 hover:border-sky-300 hover:bg-sky-100'
                : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50',
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
              ? hasBookings
                ? 'bg-white text-rose-800 shadow-sm'
                : 'bg-white text-sky-900'
              : hasBookings
                ? 'text-rose-800 group-hover:bg-rose-200'
                : 'text-slate-700 group-hover:bg-slate-100 group-hover:text-slate-900',
          ].join(' ')}
        >
          {day}
        </span>

        <i
          className={[
            'h-2.5 w-2.5 rounded-full transition',
            hasBookings ? 'bg-rose-500' : 'bg-emerald-500',
            isSelectedDay ? 'ring-2 ring-white shadow-sm' : '',
          ].join(' ')}
        />

        {hasBookings && (
          <span className="hidden text-[10px] font-medium text-rose-700 sm:block">
            {bookingCount} reserva{bookingCount > 1 ? 's' : ''}
          </span>
        )}

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

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <i className="inline-block h-2.5 w-2.5 rounded-full bg-sky-500" /> Seleccionado
        </span>
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500" /> Con reservas</span>
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" /> Libre</span>
      </div>
    </div>
  );
}

export default memo(CalendarPanel);
