import { createClient } from '@/utils/supabase/server';
import { mapIdeaRow, SELECT_IDEA } from '@/lib/ideas';
import { MAX_TEXTO } from '@/lib/biblioteca';
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
