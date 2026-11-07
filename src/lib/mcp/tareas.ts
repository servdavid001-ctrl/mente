import { CAP_MCP, asignadoMcp, type CtxMcp, type SalidaTool } from './comun';

/** buscar_tareas: pendientes del usuario ordenadas por fecha (max 50). */
export async function toolBuscarTareas(
  ctx: CtxMcp,
  args: unknown
): Promise<SalidaTool> {
  const arg = (args ?? {}) as { asignado_a?: unknown };
  const filtro =
    arg.asignado_a === undefined || arg.asignado_a === null
      ? asignadoMcp(ctx.worker)
      : asignadoMcp(arg.asignado_a);
  if (filtro === null) return { ok: false, mensaje: 'asignado_a invalido' };

  const { data, error } = await ctx.admin
    .from('tareas')
    .select('id,titulo,nota,proyecto_id,asignado_a,fecha')
    .eq('user_id', ctx.userId)
    .eq('asignado_a', filtro)
    .eq('estado', 'pendiente')
    .order('fecha', { ascending: true, nullsFirst: false })
    .limit(CAP_MCP.tareas);
  if (error) throw error;

  const ids = [...new Set(data.map((t) => t.proyecto_id))].filter(
    (id): id is string => typeof id === 'string' && id.length > 0
  );
  const nombres = await nombresProyecto(ctx, ids);

  return {
    ok: true,
    datos: {
      filtro,
      tareas: data.map((t) => ({
        id: String(t.id),
        titulo: String(t.titulo),
        nota: t.nota ?? null,
        proyecto: t.proyecto_id ? (nombres[t.proyecto_id] ?? null) : null,
        asignado_a: t.asignado_a ?? filtro,
        fecha: t.fecha ?? null
      }))
    }
  };
}

/** nombres de proyecto propios (con user_id) para enriquecer filas */
async function nombresProyecto(
  ctx: CtxMcp,
  ids: string[]
): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const { data, error } = await ctx.admin
    .from('proyectos')
    .select('id,nombre')
    .eq('user_id', ctx.userId)
    .in('id', ids);
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const fila of data) map[String(fila.id)] = String(fila.nombre);
  return map;
}
