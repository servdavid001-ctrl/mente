import { actualizarTarea, borrarTarea } from '@/lib/tareas';
import type { Asignado, Tarea } from '@/lib/types';
import type { Dispatch, SetStateAction } from 'react';

/* paso 4 (subtareas): contexto compartido de escritura del hook de tareas.
 * Las acciones viven en archivos propios (tap/alta/reordenar) para que cada
 * archivo pase del limite de 100 lineas; el estado (ocupadoId, ordenando,
 * toast) vive en useTareasProyecto y viaja en este ctx. */

const ERROR_ACCION = 'No se pudo completar la accion. Reintenta.';

export type CtxTareas = {
  proyectoId: string;
  tareas: Tarea[];
  ocupadoId: string | null;
  ordenando: boolean;
  setTareas: Dispatch<SetStateAction<Tarea[]>>;
  setOcupadoId: (valor: string | null) => void;
  setOrdenando: (valor: boolean) => void;
  avisar: (mensaje: string) => void;
};

/** alternar pendiente/hecha: optimista con rollback server */
export async function alternarTarea(ctx: CtxTareas, tarea: Tarea): Promise<void> {
  if (ctx.ocupadoId !== null) return;
  const siguiente = tarea.estado === 'pendiente' ? 'hecha' : 'pendiente';
  ctx.setOcupadoId(tarea.id);
  ctx.setTareas((prev) => prev.map((t) => (t.id === tarea.id ? { ...t, estado: siguiente } : t)));
  try {
    const actualizada = await actualizarTarea(tarea.id, { estado: siguiente });
    ctx.setTareas((prev) => prev.map((t) => (t.id === tarea.id ? actualizada : t)));
  } catch {
    ctx.setTareas((prev) => prev.map((t) => (t.id === tarea.id ? { ...t, estado: tarea.estado } : t)));
    ctx.avisar(ERROR_ACCION);
  } finally {
    ctx.setOcupadoId(null);
  }
}

/** eliminar una raiz borra en cascada sus subtareas (server) */
export async function eliminarTarea(ctx: CtxTareas, tarea: Tarea): Promise<void> {
  if (ctx.ocupadoId !== null) return;
  ctx.setOcupadoId(tarea.id);
  try {
    await borrarTarea(tarea.id);
    ctx.setTareas((prev) => prev.filter((t) => t.id !== tarea.id));
  } catch {
    ctx.avisar(ERROR_ACCION);
  } finally {
    ctx.setOcupadoId(null);
  }
}

/** reparto de la tarea (modulo 15) via PUT asignado_a */
export async function asignarTarea(ctx: CtxTareas, tarea: Tarea, valor: string): Promise<void> {
  if (ctx.ocupadoId !== null || valor === (tarea.asignado_a ?? 'yo')) return;
  const anterior: Asignado = tarea.asignado_a ?? 'yo';
  const siguiente = valor as Asignado;
  ctx.setOcupadoId(tarea.id);
  ctx.setTareas((prev) => prev.map((t) => (t.id === tarea.id ? { ...t, asignado_a: siguiente } : t)));
  try {
    const actualizada = await actualizarTarea(tarea.id, { asignado_a: siguiente });
    ctx.setTareas((prev) => prev.map((t) => (t.id === tarea.id ? actualizada : t)));
  } catch {
    ctx.setTareas((prev) => prev.map((t) => (t.id === tarea.id ? { ...t, asignado_a: anterior } : t)));
    ctx.avisar(ERROR_ACCION);
  } finally {
    ctx.setOcupadoId(null);
  }
}
