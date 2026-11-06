/* modulo 9 server: recoge las sugerencias de higiene del usuario autenticado.
 * Los filtros por user_id los aplica RLS; si el GET falla se lanza el error y
 * la ruta devuelve 500 con su patron generic, nunca PostgREST crudo. */

import { createClient } from '@/utils/supabase/server';
import {
  CAP_RECOMENDACIONES,
  DIAS_UMBRAL,
  nuevaRecomendacion,
  tituloIdea,
  type Recomendacion,
  type RecomendacionTipo
} from '@/lib/higiene';

type Supabase = Awaited<ReturnType<typeof createClient>>;

type FilaIdea = {
  id: string;
  contenido: string | null;
  titulo_pagina: string | null;
  coleccion_ids?: string[] | null;
  updated_at: string;
};

/** solo consulta: nunca altera datos y no pasa por la AI (micro-contrato) */
export async function recogerRecomendaciones(supabase: Supabase): Promise<Recomendacion[]> {
  const ahora = Date.now();
  const limiteISO = new Date(ahora - DIAS_UMBRAL * 86_400_000).toISOString();

  const [rBandeja, rApartada, rTareas, rColecciones, rConexiones, rReferencias] = await Promise.all([
    supabase
      .from('ideas')
      .select('id,contenido,titulo_pagina,updated_at')
      .eq('estado', 'bandeja')
      .eq('archivada', false)
      .lt('updated_at', limiteISO)
      .order('updated_at', { ascending: true })
      .limit(CAP_RECOMENDACIONES),
    supabase
      .from('ideas')
      .select('id,contenido,titulo_pagina,coleccion_ids,updated_at')
      .eq('estado', 'biblioteca')
      .eq('archivada', false)
      .lt('updated_at', limiteISO)
      .order('updated_at', { ascending: true }),
    supabase
      .from('tareas')
      .select('id,titulo,updated_at')
      .eq('estado', 'pendiente')
      .lt('updated_at', limiteISO)
      .order('updated_at', { ascending: true })
      .limit(CAP_RECOMENDACIONES),
    supabase.from('colecciones').select('id,nombre,updated_at').order('updated_at', { ascending: true }),
    supabase.from('conexiones').select('desde_id,hacia_id'),
    supabase.from('ideas').select('coleccion_ids')
  ]);
  for (const r of [rBandeja, rApartada, rTareas, rColecciones, rConexiones, rReferencias]) {
    if (r.error) throw r.error;
  }

  const recs: Recomendacion[] = [];
  for (const fila of (rBandeja.data ?? []) as (Omit<FilaIdea, 'coleccion_ids'>)[]) {
    recs.push(nuevaRecomendacion('idea_bandeja', fila.id, tituloIdea(fila), fila.updated_at, ahora));
  }
  for (const fila of (rTareas.data ?? []) as { id: string; titulo: string; updated_at: string }[]) {
    recs.push(nuevaRecomendacion('tarea_vieja', fila.id, String(fila.titulo), fila.updated_at, ahora));
  }

  // biblioteca apartada: sin conexiones (ni desde ni hacia) y sin coleccion_ids
  const conectadas = new Set<string>();
  for (const c of (rConexiones.data ?? []) as { desde_id: string; hacia_id: string }[]) {
    conectadas.add(String(c.desde_id));
    conectadas.add(String(c.hacia_id));
  }
  const apartadas: Recomendacion[] = [];
  for (const fila of (rApartada.data ?? []) as FilaIdea[]) {
    if ((fila.coleccion_ids ?? []).length > 0 || conectadas.has(fila.id)) continue;
    apartadas.push(nuevaRecomendacion('idea_biblioteca_apartada', fila.id, tituloIdea(fila), fila.updated_at, ahora));
  }
  recs.push(...apartadas.slice(0, CAP_RECOMENDACIONES));

  // colecciones sin ninguna idea que las referencie en ideas.coleccion_ids
  const usadas = new Set<string>();
  for (const fila of (rReferencias.data ?? []) as { coleccion_ids?: string[] | null }[]) {
    for (const cid of fila.coleccion_ids ?? []) usadas.add(String(cid));
  }
  const vacias: Recomendacion[] = [];
  for (const fila of (rColecciones.data ?? []) as { id: string; nombre: string; updated_at: string }[]) {
    if (usadas.has(fila.id)) continue;
    vacias.push(nuevaRecomendacion('coleccion_vacia', fila.id, String(fila.nombre), fila.updated_at, ahora));
  }
  recs.push(...vacias.slice(0, CAP_RECOMENDACIONES));

  return recs;
}
