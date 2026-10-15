export default function SpaceSelector({ spaces, onSelectSpace, direction }) {
  const animClass = direction === 'back' ? 'step-enter-back' : 'step-enter';

  return (
    <section className={`${animClass} rounded-3xl border border-slate-200 bg-white p-5 shadow-sm`}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Escoge un salón</h2>
        <p className="text-sm text-slate-500 mt-1">Selecciona el espacio que deseas reservar</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {spaces.map((space) => (
          <button
            key={space.id}
            type="button"
            onClick={() => onSelectSpace(space.id)}
            className="space-card overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-sky-200 w-full"
          >
            {space.img ? (
              <img src={space.img} alt={space.name} className="h-40 w-full object-cover" />
            ) : (
              <div className="flex h-40 flex-col items-center justify-center border-b border-dashed border-slate-200 bg-slate-50 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <circle cx="9" cy="10" r="1.8" />
                  <path d="M21 16l-5-5-8 9" />
                </svg>
                <span className="mt-1 text-xs">Espacio para imagen</span>
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{space.name}</h3>
                <span className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  Cap: {space.capacidad}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500 line-clamp-2">{space.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sky-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                Ver detalle
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
