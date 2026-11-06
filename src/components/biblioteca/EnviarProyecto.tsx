'use client';

import { useEffect, useState } from 'react';
import { listarProyectos } from '@/lib/foco';
import type { Proyecto } from '@/lib/types';

const BTN =
  'h-10 shrink-0 rounded-blob px-3 text-[13px] font-semibold disabled:opacity-50';

/**
 * paso "A un proyecto" del CategorizarSheet (modulo 12): lista los proyectos
 * y envia la idea con el PUT existente (ideaAcciones: { proyectoId, estado })
 * a Notas ('proyecto') o Investigacion ('investigacion'). Sin rutas nuevas ni DB.
 */
export default function EnviarProyecto(props: {
  ocupado: boolean;
  onEnviar: (proyectoId: string, estado: 'proyecto' | 'investigacion') => Promise<boolean>;
  onVolver: () => void;
}) {
  const [lista, setLista] = useState<Proyecto[] | null>(null);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    listarProyectos()
      .then((r) => { if (vivo) setLista(r.proyectos); })
      .catch(() => { if (vivo) setError('No pudimos cargar los proyectos. Reintenta.'); });
    return () => { vivo = false; };
  }, []);

  async function enviar(proyecto: Proyecto, estado: 'proyecto' | 'investigacion') {
    if (props.ocupado || enviandoId !== null) return;
    setEnviandoId(proyecto.id);
    setError(null);
    try {
      const ok = await props.onEnviar(proyecto.id, estado);
      if (!ok) setError('No se pudo enviar la idea. Reintenta.');
    } catch {
      setError('No se pudo enviar la idea. Reintenta.');
    } finally {
      setEnviandoId(null);
    }
  }

  const ocupado = props.ocupado || enviandoId !== null;

  return (
    <div className="space-y-2 pb-2 pt-4">
      <button
        type="button" aria-label="Volver a las colecciones"
        onClick={() => { if (!props.ocupado) props.onVolver(); }}
        className="h-9 text-[13px] font-semibold text-text-soft"
      >
        ← Volver
      </button>
      <p className="text-center font-display text-lg font-semibold">A un proyecto</p>
      <p className="px-2 text-center text-[13px] text-text-soft">La idea sale de la Biblioteca y entra al apartado elegido del proyecto.</p>

      {error ? (
        <p role="alert" className="rounded-card bg-danger px-3 py-2 text-[13px] text-white">{error}</p>
      ) : null}
      {lista === null ? (
        <p className="pt-4 text-center text-[13px] text-text-soft">Cargando proyectos...</p>
      ) : lista.length === 0 ? (
        <p className="pt-4 text-center text-[14px] text-text-soft">
          Aun no tienes proyectos. Crea el primero en Foco.
        </p>
      ) : (
        <ul className="space-y-2 pt-3">
          {lista.map((proyecto) => (
            <li
              key={proyecto.id}
              className="flex items-center gap-2 rounded-card border border-border bg-surface px-3 py-2.5"
            >
              <span className="min-w-0 flex-1 truncate text-[14px] text-text">{proyecto.nombre}</span>
              <button
                type="button" aria-label={`Enviar a Notas de ${proyecto.nombre}`}
                disabled={ocupado}
                onClick={() => void enviar(proyecto, 'proyecto')}
                className={`${BTN} border border-border text-text`}
              >
                {enviandoId === proyecto.id ? 'Enviando...' : 'Notas'}
              </button>
              <button
                type="button" aria-label={`Enviar a Investigacion de ${proyecto.nombre}`}
                disabled={ocupado}
                onClick={() => void enviar(proyecto, 'investigacion')}
                className={`${BTN} bg-accent text-white`}
              >
                Inv.
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
