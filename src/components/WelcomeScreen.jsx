import { useCallback, useEffect, useRef, useState } from 'react';

const WELCOME_DURATION = 2000;
const EXIT_DURATION = 350;

export default function WelcomeScreen({ userName, onContinue }) {
  const [exiting, setExiting] = useState(false);
  const continueRef = useRef(onContinue);
  const exitTimeoutRef = useRef(null);
  const leavingRef = useRef(false);

  useEffect(() => {
    continueRef.current = onContinue;
  }, [onContinue]);

  const handleContinue = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setExiting(true);
    exitTimeoutRef.current = window.setTimeout(() => {
      continueRef.current();
    }, EXIT_DURATION);
  }, []);

  // La bienvenida avanza sola después de 3 segundos.
  useEffect(() => {
    const autoAdvance = window.setTimeout(handleContinue, WELCOME_DURATION);
    return () => {
      window.clearTimeout(autoAdvance);
      if (exitTimeoutRef.current) window.clearTimeout(exitTimeoutRef.current);
    };
  }, [handleContinue]);

  return (
    <section
      className={[
        'flex min-h-screen items-center justify-center px-4 py-10 transition duration-300',
        exiting ? 'opacity-0 -translate-y-4' : 'animate-fade-in',
      ].join(' ')}
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <div className="mb-4 flex justify-center">
          <span className="text-5xl">🎓</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          ¡Bienvenido, {userName}!
        </h1>

        <p className="text-slate-500 mb-6">Listo para gestionar tus reservas</p>

        <button
          type="button"
          onClick={handleContinue}
          className="w-full rounded-xl bg-slate-900 py-2.5 font-medium text-white transition hover:bg-slate-700"
        >
          Continuar ahora
        </button>
      </div>
    </section>
  );
}
