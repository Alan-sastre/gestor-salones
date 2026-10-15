import { useState } from 'react';

export default function WelcomeScreen({ userName, onContinue }) {
  const [exiting, setExiting] = useState(false);

  const handleContinue = () => {
    setExiting(true);
    setTimeout(() => {
      onContinue();
    }, 350);
  };

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

        <p className="text-slate-500 mb-8">Listo para gestionar tus reservas</p>

        <button
          type="button"
          onClick={handleContinue}
          className="w-full rounded-xl bg-slate-900 py-2.5 font-medium text-white transition hover:bg-slate-700"
        >
          Continuar
        </button>
      </div>
    </section>
  );
}
