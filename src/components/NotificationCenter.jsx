import {
  FaBell,
  FaCalendarCheck,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimes
} from 'react-icons/fa';

export default function NotificationCenter({ notifications, onDismiss }) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl space-y-4">
        {notifications.map((notification) => {
          const isSuccess = notification.type === 'success';
          const Icon = isSuccess ? FaCheckCircle : FaExclamationTriangle;

          return (
            <div
              key={notification.id}
              className={[
                'rounded-[28px] border bg-white p-6 shadow-2xl ring-1',
                isSuccess ? 'border-emerald-200 ring-emerald-100' : 'border-amber-200 ring-amber-100'
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={[
                    'flex h-12 w-12 items-center justify-center rounded-2xl',
                    isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  ].join(' ')}>
                    <Icon className="text-xl" />
                  </div>

                  <div className="pt-1">
                    <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {isSuccess ? <FaCalendarCheck /> : <FaBell />} Notificación
                    </p>
                    <p className="text-lg font-semibold text-slate-900">{notification.text}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDismiss(notification.id)}
                  className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                  aria-label="Cerrar notificación"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => onDismiss(notification.id)}
                  className={[
                    'rounded-xl px-5 py-2.5 font-medium transition',
                    isSuccess ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-amber-500 text-white hover:bg-amber-600'
                  ].join(' ')}
                >
                  Aceptar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
