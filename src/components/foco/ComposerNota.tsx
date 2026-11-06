'use client';

import { useState } from 'react';

/** composer inline de la libreta (modulo 11): guarda via caller, que crea la
 * idea con estado 'proyecto' + proyecto_id. Guardar mantiene el foco visual.
 * Modulo 12: el copy deja claro que la idea vive escrita aqui directamente. */
export default function ComposerNota(props: {
  ocupado: boolean;
  onGuardar: (texto: string) => Promise<void>;
}) {
  const [texto, setTexto] = useState('');

  async function guardar() {
    const limpio = texto.trim();
    if (limpio.length === 0) return;
    try {
      await props.onGuardar(limpio);
      setTexto('');
    } catch {
      /* el error visual vive en el caller (aria-live dentro del panel) */
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void guardar();
      }}
      className="space-y-2 rounded-card border border-border bg-raised p-3"
    >
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={3}
        placeholder="Escribe la nota..."
        aria-label="Texto de la nueva nota"
        className="w-full rounded-card border border-border bg-surface px-3 py-2 text-[14px] text-text placeholder:text-text-soft"
      />
      <p className="text-[12px] text-text-soft">Se queda escrito aqui directamente.</p>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={props.ocupado}
          className="h-10 flex-1 rounded-card bg-accent text-[14px] font-semibold text-white disabled:opacity-60"
        >
          {props.ocupado ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={() => setTexto('')}
          className="h-10 rounded-card px-4 text-[14px] font-semibold text-text-soft"
        >
          Limpiar
        </button>
      </div>
    </form>
  );
}
