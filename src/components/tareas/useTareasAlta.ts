import { crearTarea } from '@/lib/tareas';
import { grupoDe, nuevoOrden } from '@/lib/tareasOrden';
import type { Tarea } from '@/lib/types';
import type { CtxTareas } from './useTareasTap';

/* paso 4 (subtareas): alta de tareas raiz y subtareas. El orden de la nueva
 * tarea se calcula con el grupo destino (raices o hijos del padre) para que
 * entre al final; si el grupo legado va en 0 el desempate createdAt decide. */

const ERROR_ACCION = 'No se pudo completar la accion. Reintenta.';

async function alta(ctx: CtxTareas, payload: {
  titulo: string;
  fecha: string | null;
  parent_id: string | null;
  orden: number;
}): Promise<Tarea> {
  const creada = await crearTarea({ ...payload, proyecto_id: ctx.proyectoId });
  ctx.setTareas((prev) => [...prev, creada]);
  return creada;
}

/** tarea raiz del proyecto */
export async function agregarTarea(
  ctx: CtxTareas,
  titulo: string,
  fecha: string | null
): Promise<void> {
  const grupo = grupoDe(ctx.tareas, null);
  await alta(ctx, { titulo, fecha, parent_id: null, orden: nuevoOrden(grupo) });
}

/** subtarea dentro de una raiz; el server valida padre propio + raiz */
export async function agregarSubtareaTarea(
  ctx: CtxTareas,
  parentId: string,
  titulo: string
): Promise<void> {
  const grupo = grupoDe(ctx.tareas, parentId);
  try {
    await alta(ctx, { titulo, fecha: null, parent_id: parentId, orden: nuevoOrden(grupo) });
  } catch {
    // el server rechaza con 400 si el padre dejo de ser raiz; avisamos
    ctx.avisar(ERROR_ACCION);
  }
}
