export default function LoginScreen({
  professorId,
  loginError,
  onIdChange,
  onSubmit,
  isSupabaseConfigured,
  isProductionBuild,
}) {
  return (
    <section className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 10h18" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight text-slate-900">Agenda de Espacios</h1>
            <p className="text-sm text-slate-500">Acceso para docentes</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Código de acceso
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="username"
              value={professorId}
              onChange={(event) => onIdChange(event.target.value)}
              placeholder="Ej: 1234"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </label>

          {isSupabaseConfigured && (
            <p className="rounded-xl bg-sky-50 px-3 py-2 text-xs leading-relaxed text-sky-800">
              IDs de prueba: <strong>1001</strong>, <strong>1002</strong>, <strong>1003</strong>, <strong>1004</strong> o <strong>1005</strong>
              <br />
              Administrador de demostración (tras ejecutar el SQL): <strong>9001</strong>
            </p>
          )}

          {!isSupabaseConfigured && isProductionBuild && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
              La base de datos no está configurada para este sitio. No se aceptarán IDs hasta configurar Supabase en Netlify y volver a publicar.
            </p>
          )}

          {!isSupabaseConfigured && !isProductionBuild && (
            <p className="rounded-xl bg-sky-50 px-3 py-2 text-xs leading-relaxed text-sky-800">
              Modo local para docentes: usa cualquier ID numérico. El administrador requiere conexión a Supabase.
            </p>
          )}

          <p className="min-h-5 text-sm text-rose-600">{loginError}</p>

          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 py-2.5 font-medium text-white transition hover:bg-slate-700"
          >
            Ingresar
          </button>
        </form>
      </div>
    </section>
  );
}
