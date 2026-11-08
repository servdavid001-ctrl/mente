'use client';

import { useEffect, useState } from 'react';
import SheetDialog from '@/components/ui/SheetDialog';

/** sheet del paquete de recado (modulo 16 A): preview del texto determinista
 * (GET del server) + Copiar con clipboard y fallback de seleccion manual.
 * Nada se guarda: el pack solo se copia. */
export default function RecadoSheet(props: { tareaId: string; onCerrar: () => void }) {
  const [recado, setRecado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let vivo = true;
    fetch(`/api/tareas/${props.tareaId}/recado`, { cache: 'no-store' })
      .then(async (res) => {
        const datos = (await res.json()) as { recado?: unknown; error?: unknown };
        if (!res.ok || typeof datos.recado !== 'string') {
          throw new Error(typeof datos.error === 'string' ? datos.error : 'Error');
        }
        if (vivo) setRecado(datos.recado);
      })
      .catch((e: unknown) => {
        if (vivo) setError(e instanceof Error ? e.message : 'Error');
      });
    return () => {
      vivo = false;
    };
  }, [props.tareaId]);

  async function copiar() {
    if (!recado) return;
    try {
      await navigator.clipboard.writeText(recado);
      setCopiado(true);
      return;
    } catch {
      /* sin permiso de clipboard: fallback de seleccion manual */
    }
    try {
      const area = document.createElement('textarea');
      area.value = recado;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      if (ok) setCopiado(true);
    } catch {
      /* el texto sigue visible para copiar a mano */
    }
  }

  return (
    <SheetDialog label="Paquete de recado" onCerrar={props.onCerrar}>
      <p className="pt-4 text-[15px] font-semibold text-text">Paquete de recado</p>
      <p className="mt-1 text-[13px] text-text-soft">
        Texto reproducible para pegarselo a un agente (muse, grok, opencode).
      </p>
      <pre
        className="mt-3 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-card border border-border bg-surface px-3 py-2 text-[12px] leading-snug text-text"
        aria-label="Preview del recado"
      >
        {recado ?? (error ? error : 'Cargando recado...')}
      </pre>
      <div className="mt-3 space-y-2">
        <button
          type="button"
          aria-label="Copiar el paquete de recado"
          disabled={!recado}
          onClick={() => void copiar()}
          className="h-11 w-full rounded-card bg-accent text-[14px] font-semibold text-white disabled:opacity-40"
        >
          {copiado ? 'Copiado' : 'Copiar recado'}
        </button>
        <button
          type="button"
          aria-label="Cerrar el recado"
          onClick={props.onCerrar}
          className="h-11 w-full rounded-card border border-border text-[14px] font-semibold text-text"
        >
          Cerrar
        </button>
      </div>
    </SheetDialog>
  );
}
