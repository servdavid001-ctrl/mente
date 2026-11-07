import { esUuid } from '@/lib/foco';
import {
  CAP_MCP,
  insertarIdeaMcp,
  textoMcp,
  type CtxMcp,
  type SalidaTool
} from './comun';

/** terminar_tarea: PUT estado 'hecha' filtrado por user_id (admin) y, si
 * hay resultado, se deja como nota '[resultado worker] ...' del proyecto. */

export async function toolTerminarTarea(ctx: CtxMcp, args: unknown): Promise<SalidaTool> {
  const arg = (args ?? {}) as { id?: unknown; resultado?: unknown };
  if (!esUuid(arg.id)) return { ok: false, mensaje: 'id invalido' };
  const idTarea = arg.id as string;
  const resultado =
    arg.resultado === undefined || arg.resultado === null
      ? null
      : textoMcp(arg.resultado, CAP_MCP.texto);
  if (resultado === undefined) return { ok: false, mensaje: 'resultado invalido' };

  const { data, error } = await ctx.admin
    .from('tareas')
    .update({ estado: 'hecha' })
    .eq('id', idTarea)
    .eq('user_id', ctx.userId)
    .select('id,proyecto_id')
    .maybeSingle();
  if (error) throw error;
  if (!data) return { ok: false, mensaje: 'Tarea no encontrada' };

  const notaId = resultado === null ? null : await notaResultado(ctx, data, resultado);
  return { ok: true, datos: { terminada: true, id: idTarea, nota_id: notaId } };
}

/** '[resultado worker] ...' en el proyecto de la tarea (o bandeja sin ella) */
async function notaResultado(
  ctx: CtxMcp,
  fila: { proyecto_id: unknown },
  resultado: string
): Promise<string> {
  const proyectoId =
    typeof fila.proyecto_id === 'string' && fila.proyecto_id.length > 0
      ? fila.proyecto_id
      : null;
  return await insertarIdeaMcp(ctx, {
    parent_id: null,
    proyecto_id: proyectoId,
    estado: proyectoId ? 'proyecto' : 'bandeja',
    contenido: `[resultado worker] ${resultado}`
  });
}
