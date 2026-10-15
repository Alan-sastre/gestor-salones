export default function AppHeader({ userName, onLogout }) {
  return (
    <header className="border-b border-sky-200 bg-sky-50/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl text-sky-900">Agenda de Espacios</h1>
          <p className="text-sm text-sky-700">Primero elige un salón y luego agenda tu reserva.</p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs uppercase tracking-wide text-neutral-900">Docente</p>
          <p className="text-sm font-bold text-slate-900">{userName}</p>
          <button
            type="button"
            onClick={onLogout}
            className="mt-1 text-xs font-bold underline text-neutral-900 hover:text-sky-900"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
