import { esFechaISO } from '@/lib/foco';
import {
  CAP_MCP,
  asignadoMcp,
  resolverProyecto,
  textoMcp,
  type CtxMcp,
  type SalidaTool
} from './comun';

/** crear_tarea (con asignado_a default del worker); terminar_tarea vive en hecha.ts */

export async function toolCrearTarea(ctx: CtxMcp, args: unknown): Promise<SalidaTool> {
  const arg = (args ?? {}) as {
    proyecto?: unknown; titulo?: unknown; nota?: unknown; asignado_a?: unknown; fecha?: unknown;
  };
  const proyecto = await resolverProyecto(ctx, arg.proyecto);
  if (proyecto === null) return { ok: false, mensaje: 'Proyecto no encontrado' };
  const titulo = textoMcp(arg.titulo, CAP_MCP.titulo);
  if (titulo === null) return { ok: false, mensaje: `titulo invalido (1-${CAP_MCP.titulo} chars)` };
  const nota =
    arg.nota === undefined || arg.nota === null ? null : textoMcp(arg.nota, CAP_MCP.texto);
  if (nota === undefined) return { ok: false, mensaje: 'nota invalida' };
  const asignado =
    arg.asignado_a === undefined || arg.asignado_a === null
      ? asignadoMcp(ctx.worker)
      : asignadoMcp(arg.asignado_a);
  if (asignado === null) return { ok: false, mensaje: 'asignado_a invalido' };
  const fecha = arg.fecha === undefined || arg.fecha === null ? null : normalizarFecha(arg.fecha);
  if (fecha === undefined) return { ok: false, mensaje: 'fecha invalida' };

  const { data, error } = await ctx.admin
    .from('tareas')
    .insert({
      user_id: ctx.userId,
      proyecto_id: proyecto.id,
      titulo,
      nota,
      asignado_a: asignado,
      fecha
    })
    .select('id')
    .single();
  if (error) throw error;
  return {
    ok: true,
    datos: {
      creada: 'tarea',
      id: String(data.id),
      proyecto: proyecto.nombre,
      asignado_a: asignado
    }
  };
}

/** undefined = invalido; null = sin fecha; string = ISO date valido */
function normalizarFecha(valor: unknown): string | null | undefined {
  if (valor === undefined || valor === null) return null;
  if (typeof valor !== 'string' || !esFechaISO(valor)) return undefined;
  return valor;
}
