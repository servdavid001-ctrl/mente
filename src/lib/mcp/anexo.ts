import { CAP_MCP, insertarIdeaMcp, resolverProyecto, textoMcp, type CtxMcp, type SalidaTool } from './comun';

/** pedir_anexo: nota con la marca del worker para que David la vea.
 * Sin proyecto -> bandeja; con proyecto -> nota del panel proyecto. */

export async function toolPedirAnexo(ctx: CtxMcp, args: unknown): Promise<SalidaTool> {
  const arg = (args ?? {}) as { mensaje?: unknown; proyecto?: unknown };
  const mensaje = textoMcp(arg.mensaje, CAP_MCP.texto);
  if (mensaje === null) {
    return { ok: false, mensaje: `mensaje invalido (1-${CAP_MCP.texto} chars)` };
  }
  const proyecto = await resolverProyecto(ctx, arg.proyecto);
  if (arg.proyecto !== undefined && arg.proyecto !== null && proyecto === null) {
    return { ok: false, mensaje: 'Proyecto no encontrado' };
  }

  const id = await insertarIdeaMcp(ctx, {
    parent_id: null,
    proyecto_id: proyecto?.id ?? null,
    estado: proyecto ? 'proyecto' : 'bandeja',
    contenido: `[${ctx.worker} pide] ${mensaje}`
  });
  return {
    ok: true,
    datos: {
      pedido: 'anexo',
      id,
      proyecto: proyecto?.nombre ?? null,
      destino: proyecto ? 'proyecto' : 'bandeja'
    }
  };
}
