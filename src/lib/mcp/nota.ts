import { CAP_MCP, insertarIdeaMcp, resolverProyecto, textoMcp, type CtxMcp, type SalidaTool } from './comun';
import { anidamientoAdmin } from './anidamiento';

/** crear_nota (pagina nueva del panel de proyecto) y crear_subpagina
 * (hija de una pagina existente con profundidad max 3). */

export async function toolCrearNota(ctx: CtxMcp, args: unknown): Promise<SalidaTool> {
  const arg = (args ?? {}) as { proyecto?: unknown; texto?: unknown };
  const proyecto = await resolverProyecto(ctx, arg.proyecto);
  if (proyecto === null) return { ok: false, mensaje: 'Proyecto no encontrado' };
  const texto = textoMcp(arg.texto, CAP_MCP.texto);
  if (texto === null) return { ok: false, mensaje: `texto invalido (1-${CAP_MCP.texto} chars)` };

  await insertarIdeaMcp(ctx, {
    parent_id: null,
    proyecto_id: proyecto.id,
    estado: 'proyecto',
    contenido: texto
  });
  return {
    ok: true,
    datos: { creado: 'nota', proyecto: proyecto.nombre, caracteres: texto.length }
  };
}

export async function toolCrearSubpagina(ctx: CtxMcp, args: unknown): Promise<SalidaTool> {
  const arg = (args ?? {}) as { proyecto?: unknown; pagina_titulo?: unknown; texto?: unknown };
  const proyecto = await resolverProyecto(ctx, arg.proyecto);
  if (proyecto === null) return { ok: false, mensaje: 'Proyecto no encontrado' };
  const padre = textoMcp(arg.pagina_titulo, CAP_MCP.titulo);
  if (padre === null) return { ok: false, mensaje: 'pagina_titulo invalido (1-200 chars)' };
  const texto = textoMcp(arg.texto, CAP_MCP.texto);
  if (texto === null) return { ok: false, mensaje: `texto invalido (1-${CAP_MCP.texto} chars)` };

  const pagina = await paginaPadre(ctx, proyecto.id, padre);
  if (pagina === null) return { ok: false, mensaje: 'Pagina padre no encontrada' };
  const anidado = await anidamientoAdmin(ctx.admin, ctx.userId, pagina);
  if (anidado === null) return { ok: false, mensaje: 'Profundidad maxima alcanzada' };

  await insertarIdeaMcp(ctx, {
    parent_id: anidado.parent_id,
    proyecto_id: anidado.proyecto_id ?? proyecto.id,
    estado: 'proyecto',
    contenido: texto
  });
  return {
    ok: true,
    datos: { creado: 'subpagina', proyecto: proyecto.nombre, caracteres: texto.length }
  };
}

/** id de la pagina padre del proyecto (primera linea ilike prefijo) */
async function paginaPadre(
  ctx: CtxMcp,
  proyectoId: string,
  inicio: string
): Promise<string | null> {
  const patron = `${inicio.replace(/[%_]/g, (m) => `\\${m}`)}%`;
  const { data, error } = await ctx.admin
    .from('ideas')
    .select('id')
    .eq('user_id', ctx.userId)
    .eq('proyecto_id', proyectoId)
    .eq('estado', 'proyecto')
    .eq('archivada', false)
    .ilike('contenido', patron)
    .limit(1);
  if (error) throw error;
  return data && data.length > 0 ? String(data[0].id) : null;
}
