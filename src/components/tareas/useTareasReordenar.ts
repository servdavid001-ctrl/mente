import { actualizarTarea } from '@/lib/tareas';
import { grupoDe, renumerar } from '@/lib/tareasOrden';
import type { Tarea } from '@/lib/types';
import type { CtxTareas } from './useTareasTap';

/* paso 4 (subtareas): reordenar con flechas (arriba/abajo), sin drag. Se
 * intercambia la tarea con su vecina del mismo grupo (raices o hijos de un
 * mismo padre) y se renumera el grupo; solo los cambios de orden viajan al
 * server (PUT orden). Flechas deshabilitadas en los extremos del grupo. */

const ERROR_ORDEN = 'No se pudo reordenar. Reintenta.';

export async function reordenarTarea(
  ctx: CtxTareas,
  tarea: Tarea,
  direccion: 'arriba' | 'abajo'
): Promise<void> {
  if (ctx.ordenando) return;
  const grupo = grupoDe(ctx.tareas, tarea.parentId ?? null);
  const indice = grupo.findIndex((t) => t.id === tarea.id);
  const vecina = direccion === 'arriba' ? grupo[indice - 1] : grupo[indice + 1];
  if (!vecina) return;

  const grupoNuevo = [...grupo];
  const vecinaIndice = direccion === 'arriba' ? indice - 1 : indice + 1;
  grupoNuevo[indice] = vecina;
  grupoNuevo[vecinaIndice] = tarea;

  const cambios = renumerar(grupoNuevo);
  if (cambios.length === 0) return;

  ctx.setOrdenando(true);
  try {
    for (const cambio of cambios) {
      await actualizarTarea(cambio.id, { orden: cambio.orden });
    }
    ctx.setTareas((prev) =>
      prev.map((t) => {
        const cambio = cambios.find((c) => c.id === t.id);
        return cambio ? { ...t, orden: cambio.orden } : t;
      })
    );
  } catch {
    ctx.avisar(ERROR_ORDEN);
  } finally {
    ctx.setOrdenando(false);
  }
}
