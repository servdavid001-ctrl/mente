import { mapIdeaRow, SELECT_IDEA } from '@/lib/ideas';
import {
  mapObjetivoRow,
  mapProyectoRow,
  type ObjetivoRow,
  type ProyectoRow
} from '@/lib/foco';
import type { Idea, Objetivo, Proyecto } from '@/lib/types';
import type { createClient } from '@/utils/supabase/server';

type Supabase = Awaited<ReturnType<typeof createClient>>;

export const COLS_PROYECTO =
  'id,nombre,descripcion,color,plegado,orden,created_at,updated_at';
export const COLS_OBJETIVO =
  'id,proyecto_id,titulo,descripcion,estado,fecha,created_at,updated_at';

/** body JSON tolerante: un body vacio/invalido degenera en null (400 aguas arriba) */
export async function leerJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** conteos que devuelve la API en cada proyecto (ideas no archivadas / activos) */
export async function contarDeProyecto(
  supabase: Supabase,
  id: string
): Promise<{ ideas: number; objetivosActivos: number }> {
  const [rIdeas, rObjetivos] = await Promise.all([
    supabase
      .from('ideas')
      .select('id', { count: 'exact', head: true })
      .eq('proyecto_id', id)
      .eq('archivada', false),
    supabase
      .from('objetivos')
      .select('id', { count: 'exact', head: true })
      .eq('proyecto_id', id)
      .eq('estado', 'activo')
  ]);
  if (rIdeas.error) throw rIdeas.error;
  if (rObjetivos.error) throw rObjetivos.error;
  return { ideas: rIdeas.count ?? 0, objetivosActivos: rObjetivos.count ?? 0 };
}

/** proyecto + objetivos + ideas (null = no existe o no es del usuario por RLS) */
export async function cargarProyectoConDetalle(
  supabase: Supabase,
  id: string
): Promise<{ proyecto: Proyecto; objetivos: Objetivo[]; ideas: Idea[] } | null> {
  const { data: fila, error } = await supabase
    .from('proyectos')
    .select(COLS_PROYECTO)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!fila) return null;

  const [rIdeas, rObjetivos] = await Promise.all([
    supabase
      .from('ideas')
      .select(SELECT_IDEA)
      .eq('proyecto_id', id)
      .eq('archivada', false)
      .order('created_at', { ascending: false }),
    supabase
      .from('objetivos')
      .select(COLS_OBJETIVO)
      .eq('proyecto_id', id)
      .order('created_at', { ascending: false })
  ]);
  if (rIdeas.error) throw rIdeas.error;
  if (rObjetivos.error) throw rObjetivos.error;

  const ideas = (rIdeas.data ?? []).map((row) => mapIdeaRow(row));
  const objetivos = ((rObjetivos.data ?? []) as ObjetivoRow[]).map(mapObjetivoRow);
  const proyecto = mapProyectoRow(fila as ProyectoRow, {
    ideas: ideas.length,
    objetivosActivos: objetivos.filter((o) => o.estado === 'activo').length
  });

  return { proyecto, objetivos, ideas };
}
