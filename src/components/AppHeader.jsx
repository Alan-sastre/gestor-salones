const PROFESSOR_VIEWS = [
  { id: 'agenda', label: 'Agenda' },
  { id: 'equipment', label: 'Equipos' },
  { id: 'reservations', label: 'Tus reservas' },
];

const ADMIN_VIEWS = [
  { id: 'dashboard', label: 'Dashboard' },
];

export default function AppHeader({ userName, onLogout, activeView, onViewChange, role = 'professor' }) {
  const views = role === 'admin' ? ADMIN_VIEWS : PROFESSOR_VIEWS;

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/80 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-5 gap-y-3 px-4 py-3 sm:px-6">
        <div className="min-w-fit">
          <h1 className="text-lg font-bold text-sky-950 sm:text-xl">Agenda de Espacios</h1>
        </div>

        <nav aria-label="Navegación principal" className="order-3 flex w-full gap-2 overflow-x-auto sm:order-2 sm:w-auto">
          {views.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={activeView === item.id ? 'page' : undefined}
              onClick={() => onViewChange(item.id)}
              className={[
                'whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition',
                activeView === item.id ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'text-slate-600 hover:bg-sky-50 hover:text-sky-800'
              ].join(' ')}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 sm:order-3">
          <div className="hidden text-right sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {role === 'admin' ? 'Administrador' : 'Docente'}
            </p>
            <p className="max-w-48 truncate text-sm font-bold text-slate-900">{userName}</p>
          </div>
          <button type="button" onClick={onLogout} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700">
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
