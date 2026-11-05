'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { crearTareasDesdeIdea, ideaTieneContenidoParaTareas } from '@/lib/tareas';
import type { Idea } from '@/lib/types';

const ERROR_ACCION = 'No se pudieron crear las tareas. Reintenta.';

/** boton "Convertir en tareas" del detalle: oculto si la idea no tiene contenido */
export default function BotonCrearTareas(props: {
  idea: Idea;
  onCreadas?: () => void;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!ideaTieneContenidoParaTareas(props.idea)) return null;

  async function convertir() {
    if (enviando) return;
    setEnviando(true);
    setError(null);
    setMensaje(null);
    try {
      const resultado = await crearTareasDesdeIdea(props.idea.id);
      setMensaje(
        `${resultado.creadas} ${resultado.creadas === 1 ? 'tarea creada' : 'tareas creadas'}`
      );
      props.onCreadas?.();
      router.refresh();
    } catch (fallo: unknown) {
      setError(fallo instanceof Error ? fallo.message : ERROR_ACCION);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => void convertir()}
        disabled={enviando}
        className="h-11 w-full rounded-card border border-border text-[14px] font-semibold text-text disabled:opacity-50"
      >
        {enviando ? 'Creando tareas...' : 'Convertir en tareas'}
      </button>
      {mensaje ? (
        <p role="status" className="text-[12px] text-success">
          {mensaje}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-[12px] text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
