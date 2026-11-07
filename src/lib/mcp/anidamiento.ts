import type { SupabaseAdmin } from '@/utils/supabase/admin';
import { esUuid } from '@/lib/foco';

/** modulo 13 (paginas) replicado para el contexto admin del MCP: sin sesion
 * no hay RLS, asi que cada paso leido filtrа user_id del token. Profundidad
 * maxima identica: raiz (1) + 2 hijos = 3. */

const MAX_PROFUNDIDAD = 3;

type Fila = { id: string; parent_id: string | null; proyecto_id: string | null };

async function cargarFilaAdmin(
  admin: SupabaseAdmin,
  userId: string,
  ideaId: string
): Promise<Fila | null> {
  const { data, error } = await admin
    .from('ideas')
    .select('id,parent_id,proyecto_id')
    .eq('id', ideaId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: String(data.id),
    parent_id: data.parent_id == null ? null : String(data.parent_id),
    proyecto_id: data.proyecto_id == null ? null : String(data.proyecto_id)
  };
}

async function profundidadAdmin(
  admin: SupabaseAdmin,
  userId: string,
  ideaId: string
): Promise<number | null> {
  let actual = ideaId;
  for (let nivel = 1; nivel <= MAX_PROFUNDIDAD; nivel += 1) {
    const fila = await cargarFilaAdmin(admin, userId, actual);
    if (fila === null) return null;
    if (fila.parent_id === null) return nivel;
    actual = fila.parent_id;
  }
  return null;
}

/** padre propio que admite profundidad <= 3; devuelve el proyecto heredado.
 * null = padre inexistente/ajeno o profundidad maxima superada */
export async function anidamientoAdmin(
  admin: SupabaseAdmin,
  userId: string,
  parentId: unknown
): Promise<{ parent_id: string; proyecto_id: string | null } | null> {
  if (!esUuid(parentId)) return null;
  const padre = await cargarFilaAdmin(admin, userId, parentId);
  if (padre === null) return null;
  const nivel = await profundidadAdmin(admin, userId, parentId);
  if (nivel === null || nivel + 1 > MAX_PROFUNDIDAD) return null;
  return { parent_id: padre.id, proyecto_id: padre.proyecto_id };
}
