'use client';

/* modulo 9: acciones del panel de higiene. Cada accion es un clic explicito
 * del usuario; "Eliminar" pide confirmacion doble (ventana confirmada de
 * nuevo, porque es destructiva). El item se saca al instante de la vista y
 * vuelve si la API falla. Reutilizan las rutas existentes: nunca rutas nuevas. */

import { useState } from 'react';
import { type Recomendacion } from '@/lib/higiene';

const ERROR_ACCION = 'No se pudo completar la accion. Reintenta.';

export type AccionesHigiene = {
  ocupadoId: string | null;
  archivar: (rec: Recomendacion) => void;
  marcarHecha: (rec: Recomendacion) => void;
  eliminar: (rec: Recomendacion) => void;
};

type Coordinador = {
  quitar: (rec: Recomendacion) => () => void;
  aviso: (mensaje: string) => void;
};

/** confirmacion doble exigida antes de cualquier eliminacion */
function confirmaDoble(titulo: string): boolean {
  return (
    window.confirm(`Eliminar definitivamente "${titulo}"?`) &&
    window.confirm('Confirmar de nuevo: esta accion no se puede deshacer.')
  );
}

export function useHigieneAcciones(coord: Coordinador): AccionesHigiene {
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);

  function aplicar(peticion: () => Promise<boolean>, rec: Recomendacion) {
    if (ocupadoId !== null) return;
    setOcupadoId(rec.id);
    const volver = coord.quitar(rec);
    void (async () => {
      try {
        if (!(await peticion())) throw new Error('fallo accion');
      } catch {
        volver();
        coord.aviso(ERROR_ACCION);
      } finally {
        setOcupadoId(null);
      }
    })();
  }

  return {
    ocupadoId,
    archivar: (rec) =>
      aplicar(async () => {
        const res = await fetch(`/api/ideas/${rec.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ archivada: true })
        });
        return res.ok;
      }, rec),
    marcarHecha: (rec) =>
      aplicar(async () => {
        const res = await fetch(`/api/tareas/${rec.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: 'hecha' })
        });
        return res.ok;
      }, rec),
    eliminar: (rec) => {
      if (ocupadoId !== null) return;
      if (!confirmaDoble(rec.titulo)) return;
      aplicar(async () => {
        const ruta =
          rec.tipo === 'tarea_vieja'
            ? `/api/tareas/${rec.id}`
            : rec.tipo === 'coleccion_vacia'
              ? `/api/colecciones/${rec.id}`
              : `/api/ideas/${rec.id}`;
        return (await fetch(ruta, { method: 'DELETE' })).ok;
      }, rec);
    }
  };
}
