export default function SpaceDetailScreen({ space, onContinue, onBack, direction }) {
  const animClass = direction === 'back' ? 'step-enter-back' : 'step-enter';

  return (
    <div className={`${animClass} rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden`}>
      {/* Hero image */}
      <div className="relative h-64 w-full bg-slate-100 overflow-hidden">
        {space.img ? (
          <img
            src={space.img}
            alt={space.name}
            className="h-full w-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-slate-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="9" cy="10" r="1.8" />
              <path d="M21 16l-5-5-8 9" />
            </svg>
            <span className="mt-2 text-sm font-medium">Sin imagen disponible</span>
          </div>
        )}
        {/* Capacity badge overlay */}
        <span className="absolute top-4 right-4 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-slate-700 shadow">
          👥 {space.capacidad} personas
        </span>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-3">{space.name}</h2>
        <p className="text-base text-slate-600 mb-6 leading-relaxed">{space.desc}</p>

        {space.features && space.features.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-3">Características</h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {space.features.map((feat, i) => (
                <li key={i} className="flex items-center gap-2 text-slate-700">
                  <span className="flex-shrink-0 h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">✓</span>
                  {feat}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Atrás
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 active:scale-95 shadow-sm"
          >
            Continuar
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
