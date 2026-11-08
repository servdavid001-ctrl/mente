import type { createClient } from '@/utils/supabase/server';
import { esUuid } from '@/lib/foco';

type Supabase = Awaited<ReturnType<typeof createClient>>;

/* paso 4 (cuadros del proyecto): subtareas en tareas con self-reference en
 * tareas.parent_id, mismo patron de paginas.ts. NIVEL maximo = 1: solamente
 * una tarea RAIZ propia es padre; una tarea con subtareas no puede convertirse
 * en subtarea, asi los ciclos son imposibles por construccion. El RLS
 * (owner-only) garantiza que las filas cargadas sean propias. */

type Fila = { id: string; parent_id: string | null; proyecto_id: string | null };

async function cargarTarea(supabase: Supabase, id: string): Promise<Fila | null> {
  const { data, error } = await supabase
    .from('tareas')
    .select('id,parent_id,proyecto_id')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: String(data.id),
    parent_id: data.parent_id == null ? null : String(data.parent_id),
    proyecto_id: data.proyecto_id == null ? null : String(data.proyecto_id)
  };
}

/** POST parent_id: el padre de la subtarea debe existir y ser RAIZ propia.
 * null = padre inexistente/ajeno (RLS) o ya es subtarea */
export async function padreValidoNueva(
  supabase: Supabase,
  parentId: unknown
): Promise<Fila | null> {
  if (!esUuid(parentId)) return null;
  const padre = await cargarTarea(supabase, parentId);
  if (padre === null || padre.parent_id !== null) return null;
  return padre;
}

export type ResultadoMover =
  | { ok: true; padre: Fila | null }
  | { ok: false; error: string };

/** PUT parent_id: null = a raiz (siempre valido). A una raiz: el padre debe
 * ser propio, raiz, distinta de la tarea movida y del mismo proyecto; la tarea
 * movida no puede tener subtareas propias (NIVEL max 1) */
export async function moverSubtareaValida(
  supabase: Supabase,
  tareaId: string,
  parentId: string | null
): Promise<ResultadoMover> {
  if (parentId === null) return { ok: true, padre: null };
  const padre = await cargarTarea(supabase, parentId);
  if (padre === null) return { ok: false, error: 'Subtarea invalida' };
  if (padre.id === tareaId) return { ok: false, error: 'Movimiento invalido' };
  if (padre.parent_id !== null) return { ok: false, error: 'El padre debe ser raiz' };
  const tarea = await cargarTarea(supabase, tareaId);
  if (tarea === null) return { ok: false, error: 'Subtarea invalida' };
  if ((padre.proyecto_id ?? null) !== (tarea.proyecto_id ?? null)) {
    return { ok: false, error: 'El padre debe ser del mismo proyecto' };
  }
  const { data: hijo, error: errorHijo } = await supabase
    .from('tareas')
    .select('id')
    .eq('parent_id', tareaId)
    .limit(1)
    .maybeSingle();
  if (errorHijo) throw errorHijo;
  if (hijo) {
    return { ok: false, error: 'Una tarea con subtareas no puede ser subtarea' };
  }
  return { ok: true, padre };
}
