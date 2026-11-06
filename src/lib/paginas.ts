import type { createClient } from '@/utils/supabase/server';
import { esUuid } from '@/lib/foco';

type Supabase = Awaited<ReturnType<typeof createClient>>;

/* paginas/subpaginas estilo Notion (modulo 13, modelo LIGHT): self-reference
 * en ideas.parent_id; profundidad maxima = 1 raiz + 2 hijos */
export const MAX_PROFUNDIDAD = 3;

type Fila = { id: string; parent_id: string | null; proyecto_id: string | null };

/** profundidad de una idea (raiz = 1 ... MAX): sube por la cadena de padres.
 * null si no existe (RLS), la cadena esta rota/ciclica o excede el maximo */
export async function profundidadDe(
  supabase: Supabase,
  ideaId: string
): Promise<number | null> {
  let actual = ideaId;
  for (let nivel = 1; nivel <= MAX_PROFUNDIDAD; nivel += 1) {
    const fila = await cargarFila(supabase, actual);
    if (fila === null) return null;
    if (fila.parent_id === null) return nivel;
    actual = fila.parent_id;
  }
  return null;
}

async function cargarFila(supabase: Supabase, id: string): Promise<Fila | null> {
  const { data, error } = await supabase
    .from('ideas')
    .select('id,parent_id,proyecto_id')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: String(data.id),
    parent_id: data.parent_id == null ? null : String(data.parent_id),
    proyecto_id: data.proyecto_id == null ? null : String(data.proyecto_id)
  };
}

/** POST destino { parent_id }: la idea nueva vive como hijo del padre. El RLS
 * garantiza que el padre sea del usuario; devuelve el proyecto heredado.
 * null = padre inexistente/ajeno o profundidad maxima superada */
export async function validarAnidamiento(
  supabase: Supabase,
  parentId: unknown
): Promise<{ parent_id: string; proyecto_id: string | null } | null> {
  if (!esUuid(parentId)) return null;
  const padre = await cargarFila(supabase, parentId);
  if (padre === null) return null;
  const nivel = await profundidadDe(supabase, parentId);
  if (nivel === null || nivel + 1 > MAX_PROFUNDIDAD) return null;
  return { parent_id: padre.id, proyecto_id: padre.proyecto_id };
}

export type ResultadoMover = { ok: true } | { ok: false; error: string };

/** PUT parent_id: mover una idea existente (null = raiz). valida idea y padre
 * propios (RLS), mismo proyecto, profundidad max 3 y sin ciclos: el nuevo
 * padre no puede ser un descendiente de la idea que se mueve */
export async function validarMover(
  supabase: Supabase,
  ideaId: string,
  parentId: string | null
): Promise<ResultadoMover> {
  if (parentId === null) return { ok: true };
  const idea = await cargarFila(supabase, ideaId);
  if (idea === null) return { ok: false, error: 'Datos invalidos' };
  const padre = await cargarFila(supabase, parentId);
  if (padre === null) return { ok: false, error: 'Datos invalidos' };
  if (padre.id === idea.id) return { ok: false, error: 'Movimiento invalido' };
  if ((padre.proyecto_id ?? null) !== (idea.proyecto_id ?? null)) {
    return { ok: false, error: 'El padre debe estar en el mismo proyecto' };
  }
  let profundidad = 1;
  let actual = padre;
  for (;;) {
    if (actual.parent_id === null) break;
    if (actual.parent_id === ideaId) {
      return { ok: false, error: 'Movimiento no permitido (ciclo)' };
    }
    const siguiente = await cargarFila(supabase, actual.parent_id);
    if (siguiente === null) return { ok: false, error: 'Datos invalidos' };
    if (siguiente.id === ideaId) {
      return { ok: false, error: 'Movimiento no permitido (ciclo)' };
    }
    actual = siguiente;
    profundidad += 1;
    if (profundidad > MAX_PROFUNDIDAD) return { ok: false, error: 'Datos invalidos' };
  }
  // el hijo renaceria con profundidad = profundidad(padre) + 1
  if (profundidad + 1 > MAX_PROFUNDIDAD) {
    return { ok: false, error: 'Profundidad maxima alcanzada' };
  }
  return { ok: true };
}
