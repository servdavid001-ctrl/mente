'use client';

import { useEffect, useState } from 'react';

type EventoInstalacion = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function yaInstalada(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

/** boton de instalacion PWA solo si el navegador lo ofrece; si no, instrucciones */
export default function InstalarPWA() {
  const [evento, setEvento] = useState<EventoInstalacion | null>(null);
  const [instalada, setInstalada] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    setInstalada(yaInstalada());
    function alPrompt(e: Event) {
      e.preventDefault();
      setEvento(e as EventoInstalacion);
    }
    function alInstalar() {
      setInstalada(true);
      setEvento(null);
      setMensaje('Ya esta instalada.');
    }
    window.addEventListener('beforeinstallprompt', alPrompt);
    window.addEventListener('appinstalled', alInstalar);
    return () => {
      window.removeEventListener('beforeinstallprompt', alPrompt);
      window.removeEventListener('appinstalled', alInstalar);
    };
  }, []);

  async function instalar() {
    if (!evento) return;
    setMensaje('');
    try {
      await evento.prompt();
      const eleccion = await evento.userChoice;
      if (eleccion.outcome === 'accepted') {
        setInstalada(true);
        setEvento(null);
      }
    } catch {
      setMensaje('No se pudo abrir el instalador. Usa el menu del navegador.');
    }
  }

  if (instalada) {
    return (
      <p role="status" className="text-[13px] font-semibold text-text">
        Ya esta instalada.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {evento ? (
        <button
          type="button"
          onClick={() => void instalar()}
          className="h-11 rounded-xl bg-[var(--accent-strong)] px-4 text-[13px] font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)]"
        >
          Instalar en este dispositivo
        </button>
      ) : (
        <ol className="list-decimal space-y-1 pl-5 text-[13px] text-text-soft">
          <li>En Chrome Android, abre el menu de tres puntos y elige &quot;Instalar app&quot;.</li>
          <li>En iPhone, abre Compartir y elige &quot;Anadir a pantalla de inicio&quot;.</li>
        </ol>
      )}
      {mensaje ? (
        <p role="status" className="text-[13px] text-danger">
          {mensaje}
        </p>
      ) : null}
    </div>
  );
}
