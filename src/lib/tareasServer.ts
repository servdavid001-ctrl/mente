import { mapTareaRow, type TareaRow } from '@/lib/tareas';
import type { Tarea } from '@/lib/types';
import type { createClient } from '@/utils/supabase/server';

type Supabase = Awaited<ReturnType<typeof createClient>>;

export const COLS_TAREA =
  'id,proyecto_id,objetivo_id,idea_id,titulo,nota,estado,asignado_a,fecha,orden,created_at,updated_at';

export type FilaTareaNueva = {
  titulo: string;
  nota: string | null;
  proyecto_id: string | null;
  objetivo_id: string | null;
  idea_id: string | null;
  fecha: string | null;
  orden: number;
};

/** body JSON tolerante: un body vacio/invalido degenera en null (400 arriba) */
export async function leerJsonTareas(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

type TablaRelacion = 'proyectos' | 'objetivos' | 'ideas';

/** true solo si existe y es visible para el usuario (RLS); evita enlaces ajenos */
export async function existePropio(
  supabase: Supabase,
  tabla: TablaRelacion,
  id: string
): Promise<boolean> {
  const { data, error } = await supabase.from(tabla).select('id').eq('id', id).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

/** primera relacion invalida del payload, o null si todas son validas */
export async function relacionInvalida(
  supabase: Supabase,
  refs: { proyecto_id?: unknown; objetivo_id?: unknown; idea_id?: unknown }
): Promise<TablaRelacion | null> {
  const comprobaciones: Array<{ tabla: TablaRelacion; id: string }> = [];
  if (typeof refs.proyecto_id === 'string' && refs.proyecto_id) {
    comprobaciones.push({ tabla: 'proyectos', id: refs.proyecto_id });
  }
  if (typeof refs.objetivo_id === 'string' && refs.objetivo_id) {
    comprobaciones.push({ tabla: 'objetivos', id: refs.objetivo_id });
  }
  if (typeof refs.idea_id === 'string' && refs.idea_id) {
    comprobaciones.push({ tabla: 'ideas', id: refs.idea_id });
  }

  const resultados = await Promise.all(
    comprobaciones.map(async (c) => ({
      tabla: c.tabla,
      existe: await existePropio(supabase, c.tabla, c.id)
    }))
  );
  const invalida = resultados.find((r) => !r.existe);
  return invalida ? invalida.tabla : null;
}

/** inserta un lote de tareas del usuario y devuelve el contrato mapeado */
export async function insertarTareas(
  supabase: Supabase,
  userId: string,
  filas: FilaTareaNueva[]
): Promise<Tarea[]> {
  const payload = filas.map((fila) => ({
    user_id: userId,
    titulo: fila.titulo,
    nota: fila.nota,
    proyecto_id: fila.proyecto_id,
    objetivo_id: fila.objetivo_id,
    idea_id: fila.idea_id,
    fecha: fila.fecha,
    orden: fila.orden
  }));

  const { data, error } = await supabase.from('tareas').insert(payload).select(COLS_TAREA);
  if (error) throw error;
  return ((data ?? []) as TareaRow[]).map(mapTareaRow);
}
