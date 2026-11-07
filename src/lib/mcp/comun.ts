import type { SupabaseAdmin } from '@/utils/supabase/admin';
import { esUuid } from '@/lib/foco';

/** modulo 15 (MCP): constantes de caps y helpers server compartidos.
 * TODAS las queries usan el admin client filtrando user_id del token: sin
 * sesion hay RLS, asi que el eq(user_id) explicito es la unica barrera. */

export const CAP_MCP = {
  tareas: 50,
  paginas: 20,
  investigaciones: 10,
  subpaginas: 10,
  titulo: 200,
  texto: 2000
} as const;

export const ASIGNADOS = ['yo', 'opencode', 'muse', 'grok'] as const;
export type AsignadoMcp = (typeof ASIGNADOS)[number];

/** salida comun de cada tool: datos JSON-serializables o mensaje de error */
export type SalidaTool = { ok: true; datos: unknown } | { ok: false; mensaje: string };

export type CtxMcp = {
  admin: SupabaseAdmin;
  userId: string;
  worker: string;
};

/** texto trimeado valido para nota/idea (1..max); null = invalido */
export function textoMcp(valor: unknown, max: number): string | null {
  if (typeof valor !== 'string') return null;
  const limpio = valor.trim();
  return limpio.length >= 1 && limpio.length <= max ? limpio : null;
}

/** asignado_a valido (o el worker por defecto ya normalizado aguas arriba) */
export function asignadoMcp(valor: unknown): AsignadoMcp | null {
  if (typeof valor !== 'string') return null;
  return (ASIGNADOS as readonly string[]).includes(valor) ? (valor as AsignadoMcp) : null;
}

export type ProyectoHallado = { id: string; nombre: string };

/** acepta uuid o nombre exacto del proyecto PROPIO (filtrado por user_id) */
export async function resolverProyecto(
  ctx: CtxMcp,
  valor: unknown
): Promise<ProyectoHallado | null> {
  if (!esUuid(valor) && typeof valor !== 'string') return null;
  const query = ctx.admin
    .from('proyectos')
    .select('id,nombre')
    .eq('user_id', ctx.userId)
    .limit(2);
  const { data, error } = esUuid(valor)
    ? await query.eq('id', valor)
    : await query.ilike('nombre', String(valor).trim());
  if (error) throw error;
  if (!data || data.length === 0) return null;
  return { id: String(data[0].id), nombre: String(data[0].nombre) };
}

export type FilaIdeaNuevaMcp = {
  parent_id: string | null;
  proyecto_id: string | null;
  estado: 'bandeja' | 'proyecto' | 'investigacion';
  contenido: string;
};

/** inserta una idea texto propia (tipo texto, sin fuente); devuelve el id */
export async function insertarIdeaMcp(
  ctx: CtxMcp,
  fila: FilaIdeaNuevaMcp
): Promise<string> {
  const { data, error } = await ctx.admin
    .from('ideas')
    .insert({
      user_id: ctx.userId,
      tipo: 'texto',
      contenido: fila.contenido,
      fuente: null,
      audio_url: null,
      estado: fila.estado,
      archivada: false,
      parent_id: fila.parent_id,
      proyecto_id: fila.proyecto_id
    })
    .select('id')
    .single();
  if (error) throw error;
  return String(data.id);
}
