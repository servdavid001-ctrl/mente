'use client';

import { useState } from 'react';
import { MAX_TITULO_TAREA } from '@/lib/tareas';

/* paso 4: composer de subtarea extraido de SubtareasDe para que ambos archivos
 * queden <=100 lineas. Estado local (titulo, enviando, error); el guardado
 * pasa por onGuardar y Cerrar solo colapsa el composer del caller. */
export default function FormSubtarea(props: {
  onGuardar: (titulo: string) => Promise<void>;
  onCerrar: () => void;
}) {
  const [titulo, setTitulo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    const limpio = titulo.trim();
    if (limpio.length === 0) return;
    setEnviando(true);
    setError(null);
    try {
      await props.onGuardar(limpio);
      setTitulo('');
      props.onCerrar();
    } catch {
      setError('No se pudo crear la subtarea. Reintenta.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void guardar();
      }}
      className="space-y-2 rounded-card border border-border bg-raised p-2"
    >
      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        maxLength={MAX_TITULO_TAREA}
        placeholder="Paso anidado"
        aria-label="Titulo de la nueva subtarea"
        className="h-10 w-full rounded-card border border-border bg-surface px-3 text-[14px] text-text placeholder:text-text-soft"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={enviando}
          className="h-9 flex-1 rounded-card bg-accent text-[13px] font-semibold text-white disabled:opacity-60"
        >
          {enviando ? 'Guardando...' : 'Anadir subtarea'}
        </button>
        <button
          type="button"
          onClick={props.onCerrar}
          className="h-9 rounded-card px-3 text-[13px] font-semibold text-text-soft"
        >
          Cerrar
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-[12px] text-danger">
          {error}
        </p>
      ) : null}
    </form>
  );
}
