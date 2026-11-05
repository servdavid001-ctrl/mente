'use client';

import { useState } from 'react';
import SeccionAjustes from './SeccionAjustes';

type Estado = 'idle' | 'cargando' | 'ok' | 'error';

/** Datos: descarga de un JSON de solo lectura generado con la sesion */
export default function AjustesDatos() {
  const [estado, setEstado] = useState<Estado>('idle');

  async function exportar() {
    if (estado === 'cargando') return;
    setEstado('cargando');
    try {
      const res = await fetch('/api/exportar', { cache: 'no-store' });
      if (!res.ok) throw new Error('export');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `mente-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
      setEstado('ok');
    } catch {
      setEstado('error');
    }
  }

  return (
    <SeccionAjustes
      id="datos"
      titulo="Datos"
      descripcion="Descarga todo lo tuyo en un archivo JSON."
    >
      <div className="space-y-3">
        <p className="text-[13px] leading-snug text-text-soft">
          Incluye ideas, colecciones, conexiones, proyectos, objetivos, tareas y
          sugerencias. El archivo se genera con tu sesion y no se envia a ningun sitio.
        </p>
        <button
          type="button"
          disabled={estado === 'cargando'}
          onClick={() => void exportar()}
          className="h-11 rounded-xl bg-[var(--accent-strong)] px-4 text-[13px] font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {estado === 'cargando' ? 'Preparando...' : 'Exportar mis datos'}
        </button>
        {estado === 'ok' ? (
          <p role="status" className="text-[13px] text-text">
            Descarga iniciada.
          </p>
        ) : null}
        {estado === 'error' ? (
          <p role="alert" className="text-[13px] text-danger">
            No se pudo exportar. Reintenta.
          </p>
        ) : null}
      </div>
    </SeccionAjustes>
  );
}
