export default function SuccessScreen({ onFinish }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50">
      <div className="flex flex-col items-center gap-6 px-6 text-center">
        {/* Success icon with pop animation */}
        <div className="success-pop flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="white"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-emerald-700 sm:text-3xl">¡Reserva confirmada!</h1>
          <p className="mt-2 text-slate-500">Tu espacio ha sido reservado exitosamente</p>
        </div>

        <button
          type="button"
          onClick={onFinish}
          className="rounded-xl bg-sky-600 px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700 active:scale-95"
        >
          Hacer otra reserva
        </button>
      </div>
    </div>
  );
}
