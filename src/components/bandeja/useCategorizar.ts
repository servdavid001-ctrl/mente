'use client';

import type { Coleccion, Idea } from '@/lib/types';
import type { GuardarCategorionPayload } from '../biblioteca/CategorizarSheet';

const ERROR_ACCION = 'No se pudo completar la accion. Reintenta.';

type Handlers = {
  setIdeas: React.Dispatch<React.SetStateAction<Idea[]>>;
  setColecciones: React.Dispatch<React.SetStateAction<Coleccion[]>>;
  toast: (mensaje: string) => void;
};

/**
 * glue del flujo Categorizar (spec modulo 2 §3): crea las colecciones nuevas,
 * guarda la accion y refleja el cambio en la lista local sin refetch.
 */
export async function guardarCategorizacion(
  ideaId: string,
  payload: GuardarCategorionPayload,
  h: Handlers
): Promise<boolean> {
  const idsExtra: string[] = [];
  try {
    for (const nueva of payload.nuevas) {
      const res = await fetch('/api/colecciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nueva.nombre, color: nueva.color })
      });
      if (!res.ok) {
        h.toast(res.status === 409 ? 'Esa coleccion ya existe' : ERROR_ACCION);
        return false;
      }
      const json = (await res.json()) as { coleccion: Coleccion };
      idsExtra.push(json.coleccion.id);
      h.setColecciones((prev) => [...prev, json.coleccion]);
    }

    const ids = [...payload.coleccionesIds, ...idsExtra];
    const res = await fetch(`/api/ideas/${ideaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'categorizar_biblioteca', coleccion_ids: ids })
    });
    if (!res.ok) {
      const detalle = await detalleError(res);
      throw new Error(detalle ?? ERROR_ACCION);
    }

    h.setIdeas((prev) =>
      prev.map((i) =>
        i.id === ideaId
          ? { ...i, estado: 'biblioteca', categorized: true, colecciones: ids }
          : i
      )
    );
    return true;
  } catch (e: unknown) {
    // rollback: sin colecciones huerfanas si el PUT fallo
    for (const id of idsExtra) {
      await fetch(`/api/colecciones/${id}`, { method: 'DELETE' }).catch(() => undefined);
      h.setColecciones((prev) => prev.filter((c) => c.id !== id));
    }
    h.toast(e instanceof Error && e.message ? e.message : ERROR_ACCION);
    return false;
  }
}

/** quitar de Biblioteca: regresa a sin categoria (spec §3 reversible siempre) */
export async function quitarDeBiblioteca(ideaId: string, h: Handlers): Promise<boolean> {
  const res = await fetch(`/api/ideas/${ideaId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accion: 'regresar_bandeja' })
  });
  if (!res.ok) {
    h.toast(ERROR_ACCION);
    return false;
  }
  h.setIdeas((prev) =>
    prev.map((i) =>
      i.id === ideaId ? { ...i, estado: 'bandeja', categorized: false, colecciones: [] } : i
    )
  );
  return true;
}

/** lee el body de error de la API si existe (patron { error: string }) */
async function detalleError(res: Response): Promise<string | undefined> {
  try {
    const json = (await res.json()) as { error?: unknown };
    return typeof json.error === 'string' && json.error ? json.error : undefined;
  } catch {
    return undefined;
  }
}
