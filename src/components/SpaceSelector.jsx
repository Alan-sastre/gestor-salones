export default function SpaceSelector({ spaces, onSelectSpace, direction }) {
  const animClass = direction === 'back' ? 'step-enter-back' : 'step-enter';

  return (
    <section className={`${animClass} rounded-3xl border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-8`}>
      <div className="mb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Encuentra tu espacio</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Escoge un salón</h2>
        <p className="mt-2 text-base text-slate-500">Selecciona un espacio para revisar su disponibilidad y reservar.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {spaces.map((space) => (
          <button
            key={space.id}
            type="button"
            onClick={() => onSelectSpace(space.id)}
            className="space-card group overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-900/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 w-full"
          >
            {space.img ? (
              <img src={space.img} alt={space.name} className="h-40 w-full object-cover" />
            ) : (
              <div className="flex h-48 flex-col items-center justify-center border-b border-dashed border-slate-200 bg-gradient-to-br from-sky-50 to-violet-50 text-slate-400 transition group-hover:from-sky-100 group-hover:to-violet-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <circle cx="9" cy="10" r="1.8" />
                  <path d="M21 16l-5-5-8 9" />
                </svg>
                <span className="mt-1 text-xs">Espacio para imagen</span>
              </div>
            )}
            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-bold text-slate-900">{space.name}</h3>
                <span className="whitespace-nowrap rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  Cap: {space.capacidad}
                </span>
              </div>
              <p className="mt-2 min-h-10 text-sm leading-relaxed text-slate-500 line-clamp-2">{space.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 transition group-hover:bg-sky-600 group-hover:text-white">
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
