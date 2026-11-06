import { createClient } from '@/utils/supabase/server';
import { mapIdeaRow, SELECT_IDEA } from '@/lib/ideas';
import { MAX_TEXTO } from '@/lib/biblioteca';
import { esUuid } from '@/lib/foco';
import { validarMover } from '@/lib/paginas';
import type { Idea } from '@/lib/types';

type Supabase = Awaited<ReturnType<typeof createClient>>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type Acciones = 'categorizar_biblioteca' | 'regresar_bandeja' | 'archivada' | 'nota';

/**
 * resuelve el PUT unificado de /api/ideas/[id]:
 * { accion: 'categorizar_biblioteca', coleccion_ids } |
 * { accion: 'regresar_bandeja' } |
 * { archivada: boolean } (contrato modulo 1) |
 * { nota: string }
 */
export async function aplicarCambio(
  supabase: Supabase,
  id: string,
  body: Record<string, unknown>
): Promise<{ idea: Idea } | 'invalido' | { error: string; status: number }> {
  if (body.accion === 'categorizar_biblioteca') {
    const ids: string[] | null = await validarColeccionIds(supabase, body.coleccion_ids);
    if (ids === null) return 'invalido';
    const { data, error } = await supabase
      .from('ideas')
      .update({ estado: 'biblioteca', coleccion_ids: ids })
      .eq('id', id)
      .select(SELECT_IDEA)
      .single();
    if (error) throw error;
    return { idea: mapIdeaRow(data) };
  }
  if (body.accion === 'regresar_bandeja') {
    const { data, error } = await supabase
      .from('ideas')
      .update({ estado: 'bandeja', coleccion_ids: [] })
      .eq('id', id)
      .select(SELECT_IDEA)
      .single();
    if (error) throw error;
    return { idea: mapIdeaRow(data) };
  }
  // modulo 4: mover una idea a un proyecto y/o cambiar su estado de proyecto
  if ('proyectoId' in body || 'estado' in body) {
    const cambios: Record<string, unknown> = {};
    if ('proyectoId' in body) {
      if (body.proyectoId !== null && !esUuid(body.proyectoId)) return 'invalido';
      if (body.proyectoId !== null) {
        const { data: proyecto, error } = await supabase
          .from('proyectos')
          .select('id')
          .eq('id', body.proyectoId)
          .maybeSingle();
        if (error) throw error;
        if (!proyecto) return { error: 'Proyecto invalido', status: 400 };
      }
      cambios.proyecto_id = body.proyectoId;
    }
    if ('estado' in body) {
      if (body.estado !== 'proyecto' && body.estado !== 'investigacion') return 'invalido';
      cambios.estado = body.estado;
    }
    if (Object.keys(cambios).length === 0) return 'invalido';
    const { data, error } = await supabase
      .from('ideas')
      .update(cambios)
      .eq('id', id)
      .select(SELECT_IDEA)
      .single();
    if (error) throw error;
    return { idea: mapIdeaRow(data) };
  }
  // modulo 13: mover la idea a otra pagina del mismo proyecto (PUT parent_id;
  // null = raiz). valida padre propio, profundidad max 3 y sin ciclos
  if ('parent_id' in body) {
    const padreId = body.parent_id;
    if (padreId !== null && !esUuid(padreId)) return 'invalido';
    const resultado = await validarMover(supabase, id, padreId as string | null);
    if (!resultado.ok) return { error: resultado.error, status: 400 };
    const { data, error } = await supabase
      .from('ideas')
      .update({ parent_id: padreId })
      .eq('id', id)
      .select(SELECT_IDEA)
      .single();
    if (error) throw error;
    return { idea: mapIdeaRow(data) };
  }
  if (typeof body.archivada === 'boolean') {
    const { data, error } = await supabase
      .from('ideas')
      .update({ archivada: body.archivada })
      .eq('id', id)
      .select(SELECT_IDEA)
      .single();
    if (error) throw error;
    return { idea: mapIdeaRow(data) };
  }
  if (typeof body.nota === 'string') {
    const nota = body.nota.slice(0, MAX_TEXTO); // misma cap que el composer (P2-2)
    const { data, error } = await supabase
      .from('ideas')
      .update({ nota })
      .eq('id', id)
      .select(SELECT_IDEA)
      .single();
    if (error) throw error;
    return { idea: mapIdeaRow(data) };
  }
  // quitar la imagen del item (deja el tipo; el hero vuelve al bloque frontal)
  if (body.media_url === null && Object.keys(body).length === 1) {
    const { data, error } = await supabase
      .from('ideas')
      .update({ media_url: null })
      .eq('id', id)
      .select(SELECT_IDEA)
      .single();
    if (error) throw error;
    return { idea: mapIdeaRow(data) };
  }
  return 'invalido';
}

/** valida los ids: formato uuid, max 20 y todos existentes para el usuario (RLS) */
async function validarColeccionIds(supabase: Supabase, ids: unknown): Promise<string[] | null> {
  if (ids === undefined) return [];
  if (!Array.isArray(ids) || ids.length > 20) return null;
  for (const id of ids) {
    if (typeof id !== 'string' || !UUID_RE.test(id)) return null;
  }
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('colecciones')
    .select('id')
    .in('id', ids as string[]);
  if (error || !data || data.length !== ids.length) return null;
  return ids as string[];
}
