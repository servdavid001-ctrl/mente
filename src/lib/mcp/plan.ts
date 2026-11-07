import { CAP_MCP, resolverProyecto, type CtxMcp, type SalidaTool } from './comun';

/** obtener_plan: paginas (titulo + contenido, max 20) + tareas pendientes. */
export async function toolObtenerPlan(
  ctx: CtxMcp,
  args: unknown
): Promise<SalidaTool> {
  const arg = (args ?? {}) as { proyecto?: unknown };
  const proyecto = await resolverProyecto(ctx, arg.proyecto);
  if (proyecto === null) return { ok: false, mensaje: 'Proyecto no encontrado' };

  const { data: paginas, error: errorPaginas } = await ctx.admin
    .from('ideas')
    .select('contenido')
    .eq('user_id', ctx.userId)
    .eq('proyecto_id', proyecto.id)
    .eq('estado', 'proyecto')
    .eq('archivada', false)
    .order('created_at', { ascending: true })
    .limit(CAP_MCP.paginas);
  if (errorPaginas) throw errorPaginas;

  const { data: tareas, error: errorTareas } = await ctx.admin
    .from('tareas')
    .select('id,titulo,nota,asignado_a,fecha')
    .eq('user_id', ctx.userId)
    .eq('proyecto_id', proyecto.id)
    .eq('estado', 'pendiente')
    .order('fecha', { ascending: true, nullsFirst: false })
    .limit(CAP_MCP.tareas);
  if (errorTareas) throw errorTareas;

  return {
    ok: true,
    datos: {
      proyecto: proyecto.nombre,
      plan: (paginas ?? []).map((p) => {
        const texto = p.contenido ?? '';
        return { titulo: texto.split('\n')[0] || 'Pagina', contenido: texto };
      }),
      tareas: (tareas ?? []).map((t) => ({
        id: String(t.id),
        titulo: String(t.titulo),
        nota: t.nota ?? null,
        asignado_a: t.asignado_a ?? 'yo',
        fecha: t.fecha ?? null
      }))
    }
  };
}
