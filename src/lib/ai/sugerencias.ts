/** helpers de sugerencias para las routes AI (modulo 3): mapping, filtro de
 * ya existentes y guardado de la minuta aceptada en ideas. */

export type SupabaseCliente = Awaited<
  ReturnType<typeof import('@/utils/supabase/server').createClient>
>;
import type { Sugerencia, SugerenciaTipo } from '@/lib/types';

export type SugerenciaRow = {
  id: string;
  idea_id: string;
  tipo: SugerenciaTipo;
  payload: Record<string, unknown> | null;
  estado: string;
};

export function mapSugerenciaRow(r: SugerenciaRow): Sugerencia {
  return {
    id: String(r.id),
    ideaId: String(r.idea_id),
    tipo: r.tipo,
    payload: r.payload ?? {},
    estado: r.estado as Sugerencia['estado']
  };
}

export const SELECT_SUGERENCIA = 'id,idea_id,tipo,payload,estado';

/** ids ya no-sugeribles: pendiente/aceptada/descartada_permanente bloquean;
 * 'descartada' puede reaparecer cuando la biblioteca crece (spec 14.3) */
export async function sugerenciasVivas(
  supabase: SupabaseCliente,
  ideaId: string
): Promise<Map<string, Sugerencia[]>> {
  const { data, error } = await supabase
    .from('sugerencias')
    .select(SELECT_SUGERENCIA)
    .eq('idea_id', ideaId)
    .neq('estado', 'descartada');
  if (error) throw error;
  const porTipo = new Map<string, Sugerencia[]>();
  for (const r of (data ?? []) as SugerenciaRow[]) {
    const lista = porTipo.get(r.tipo) ?? [];
    lista.push(mapSugerenciaRow(r));
    porTipo.set(r.tipo, lista);
  }
  return porTipo;
}

/** se queda solo con las sugerencias que NO estan vivas (sin duplicar chiches) */
export function filtrarNuevas(
  sugerencias: Array<{ tipo: string; payload: Record<string, unknown> }>,
  vivas: Map<string, Sugerencia[]>
): Array<{ tipo: string; payload: Record<string, unknown> }> {
  const yaCategoria = (vivas.get('categoria') ?? []).length > 0;
  const yaMinuta = (vivas.get('minuta') ?? []).length > 0;
  const yaConexion = new Set((vivas.get('conexion') ?? []).map((s) => String(s.payload.haciaId)));
  return sugerencias.filter((s) => {
    if (s.tipo === 'categoria') return !yaCategoria;
    if (s.tipo === 'minuta') return !yaMinuta;
    if (s.tipo === 'conexion') return !yaConexion.has(String(s.payload.haciaId));
    return false;
  });
}

/** minuta aceptada: append de ai_minuta en ideas.entidades (contrato mod 7) */
export async function guardarMinuta(
  supabase: SupabaseCliente,
  ideaId: string,
  pasos: string[]
): Promise<void> {
  const { data, error } = await supabase
    .from('ideas')
    .select('entidades')
    .eq('id', ideaId)
    .single();
  if (error) throw error;
  const previa = ((data?.entidades ?? {}) as { lista?: unknown }) ?? {};
  const { error: errU } = await supabase
    .from('ideas')
    .update({
      entidades: {
        ...previa, /* preserva otras keys del jsonb (ej: externa del modulo 10) */
        lista: Array.isArray(previa.lista) ? previa.lista : [],
        ai_minuta: { pasos, guardada: new Date().toISOString() }
      }
    })
    .eq('id', ideaId);
  if (errU) throw errU;
}
