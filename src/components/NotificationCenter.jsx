import { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const styles = {
  success: { Icon: FaCheckCircle, tone: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  warning: { Icon: FaExclamationTriangle, tone: 'border-amber-200 bg-amber-50 text-amber-900' },
  error: { Icon: FaExclamationCircle, tone: 'border-rose-200 bg-rose-50 text-rose-800' },
  info: { Icon: FaInfoCircle, tone: 'border-sky-200 bg-white text-slate-800' },
};

function NotificationToast({ notification, onDismiss }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(notification.id), 4500);
    return () => window.clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const { Icon, tone } = styles[notification.type] || styles.info;
  return (
    <div className={`toast-enter pointer-events-auto flex items-start gap-3 rounded-2xl border p-5 shadow-xl shadow-slate-900/10 backdrop-blur ${tone}`}>
      <Icon className="mt-0.5 shrink-0 text-xl" />
      <p className="flex-1 text-base font-semibold leading-relaxed sm:text-lg">{notification.text}</p>
      <button type="button" onClick={() => onDismiss(notification.id)} aria-label="Cerrar notificación" className="rounded-lg p-1 text-lg opacity-60 transition hover:bg-black/5 hover:opacity-100">
        <FaTimes />
      </button>
    </div>
  );
}

export default function NotificationCenter({ notifications, onDismiss }) {
  if (notifications.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(26rem,calc(100vw-2rem))] flex-col gap-3" aria-live="polite">
      {notifications.map((notification) => {
        return <NotificationToast key={notification.id} notification={notification} onDismiss={onDismiss} />;
      })}
    </div>
  );
}
