/** Orquestador del modulo 10 (conocimiento externo): lee las entidades
 * autor|libro ya guardadas por analizar, consulta los catalogos publicos,
 * enriquece con LA UNICA llamada AI y devuelve los items. Sin tabla nueva:
 * solo aceptar escribe en ideas.entidades.externa (jsonb, junto a lista). */

import { buscarCatalogos, type EntidadCatalogo } from './externaCatalogo';
import { enriquecerAI } from './externaIa';
import { fusionarExternas } from '@/lib/externas';
import type { SupabaseCliente } from './sugerencias';
import type { Credencial } from './provider';
import type { Entidad, Idea, ItemExterno } from '@/lib/types';

export const ERROR_SIN_ENTIDADES = 'Sin entidades tipo autor o libro en esta idea.';

/** items externos para una idea: entidades guardadas -> catalogs + AI.
 * Se usa el contenido ya analizado (transcripcion) o el texto del item. */
export async function buscarExternas(
  idea: Pick<Idea, 'text' | 'transcripcion' | 'entidades'>,
  credenciales: Credencial[]
): Promise<ItemExterno[]> {
  const lista = idea.entidades?.lista ?? [];
  const buscadas = lista.filter(
    (e) => e.tipo === 'autor' || e.tipo === 'libro'
  ) as EntidadCatalogo[];
  const conceptos = lista.filter((e) => e.tipo === 'concepto');
  if (buscadas.length === 0) throw new Error(ERROR_SIN_ENTIDADES);

  const fichas = await buscarCatalogos(buscadas);
  if (fichas.length === 0 && conceptos.length === 0) return [];
  return await enriquecerAI(fichas, conceptos, idea.transcripcion ?? idea.text, credenciales);
}

/** aceptar externa (spec): agrega items al jsonb ideas.entidades.externa,
 * fusionando por titulo+autor; si la idea nunca tuvo entidades, se crea el
 * objeto con {lista:[], externa:[...]}. Preserva lista y ai_minuta. */
export async function guardarExternas(
  supabase: SupabaseCliente,
  ideaId: string,
  entrantes: ItemExterno[]
): Promise<void> {
  const { data, error } = await supabase
    .from('ideas')
    .select('entidades')
    .eq('id', ideaId)
    .single();
  if (error) throw error;
  const previa = (data?.entidades ?? {}) as Record<string, unknown> & { lista?: unknown };
  const actuales = Array.isArray(previa.externa) ? (previa.externa as unknown[]) : [];
  const fusion = fusionarExternas(previa.externa, entrantes);
  if (fusion.length === actuales.length) return; /* nada nuevo que guardar */
  const { error: errU } = await supabase
    .from('ideas')
    .update({
      entidades: {
        ...previa,
        lista: Array.isArray(previa.lista) ? previa.lista : [],
        externa: fusion
      }
    })
    .eq('id', ideaId);
  if (errU) throw errU;
}
