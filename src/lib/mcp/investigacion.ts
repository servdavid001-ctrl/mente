import { CAP_MCP, resolverProyecto, type CtxMcp, type SalidaTool } from './comun';

/** leer_investigacion: hasta 10 investigaciones en texto plano (raiz + hijas). */
export async function toolLeerInvestigacion(
  ctx: CtxMcp,
  args: unknown
): Promise<SalidaTool> {
  const arg = (args ?? {}) as { proyecto?: unknown; titulo?: unknown };
  const proyecto = await resolverProyecto(ctx, arg.proyecto);
  if (proyecto === null) return { ok: false, mensaje: 'Proyecto no encontrado' };

  let query = ctx.admin
    .from('ideas')
    .select('id,contenido')
    .eq('user_id', ctx.userId)
    .eq('proyecto_id', proyecto.id)
    .eq('estado', 'investigacion')
    .eq('archivada', false);
  const filtro = filtroTitulo(arg.titulo);
  if (filtro === null) return { ok: false, mensaje: 'titulo invalido' };
  if (filtro !== '') query = query.ilike('contenido', filtro);

  const { data: raices, error } = await query
    .order('created_at', { ascending: true })
    .limit(CAP_MCP.investigaciones);
  if (error) throw error;

  const lista = raices ?? [];
  if (lista.length === 0) {
    return { ok: true, datos: { proyecto: proyecto.nombre, investigaciones: [] } };
  }

  const { data: hijos, error: errorHijos } = await ctx.admin
    .from('ideas')
    .select('parent_id,contenido')
    .eq('user_id', ctx.userId)
    .in('parent_id', lista.map((r) => String(r.id)))
    .order('created_at', { ascending: true });
  if (errorHijos) throw errorHijos;

  const porPadre: Record<string, string[]> = {};
  for (const hijo of hijos ?? []) {
    (porPadre[String(hijo.parent_id)] ??= []).push(String(hijo.contenido ?? ''));
  }

  return {
    ok: true,
    datos: {
      proyecto: proyecto.nombre,
      investigaciones: lista.map((r) => {
        const raiz = r.contenido ?? '';
        const extra = (porPadre[String(r.id)] ?? []).join('\n\n');
        return {
          titulo: raiz.split('\n')[0] || 'Investigacion',
          contenido: extra ? `${raiz}\n\n${extra}` : raiz
        };
      })
    }
  };
}

/** patron ilike con % final y %-escapado; '' = sin filtro */
function filtroTitulo(valor: unknown): string | null {
  if (valor === undefined || valor === null) return '';
  if (typeof valor !== 'string') return null;
  const limpio = valor.trim().slice(0, 80);
  if (limpio.length === 0) return null;
  return `${limpio.replace(/[%_]/g, (m) => `\\${m}`)}%`;
}
