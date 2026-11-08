import { NextResponse } from 'next/server';
import type { SupabaseAdmin } from '@/utils/supabase/admin';
import { normalizarWorker, type FilaTokenAgente } from '@/lib/agentesServer';
import { registrarAccionMcp, type RegistrarCtx } from '@/lib/mcp/sesiones';
import { MANEJADORES, resumenAccion } from '@/lib/mcp/despacho';
import { type CtxMcp, type SalidaTool } from '@/lib/mcp/comun';

/** helpers JSON-RPC del server MCP: envolturas ok/fallo y ejecucion de
 * tools/call con el gate de permisos por conector (modulo 19) y el log
 * de acciones (resumen sin contenido sensible). */

export function ok(id: unknown, result: unknown): NextResponse {
  return NextResponse.json({ jsonrpc: '2.0', id, result });
}

export function fallo(id: unknown, code: number, message: string, status = 200): NextResponse {
  return NextResponse.json({ jsonrpc: '2.0', id, error: { code, message } }, { status });
}

export async function llamadaTool(
  admin: SupabaseAdmin,
  filaToken: FilaTokenAgente,
  rpcId: unknown,
  paramsBruto: unknown
): Promise<NextResponse> {
  const params = (paramsBruto ?? {}) as { name?: unknown; arguments?: unknown };
  const nombre = typeof params.name === 'string' ? params.name : '';
  const handler = MANEJADORES[nombre] ?? undefined;
  if (!handler) return fallo(rpcId, -32602, `Tool no encontrada: ${nombre}`);

  const ctx: CtxMcp = {
    admin,
    userId: filaToken.user_id,
    worker: normalizarWorker(filaToken.nombre)
  };

  if (!permitida(filaToken.permisos, nombre)) {
    void registrarAccionMcp(
      ctx as RegistrarCtx,
      filaToken.id,
      'bloqueada',
      null,
      `tool ${nombre} no permitida por el conector`
    ).catch(() => undefined);
    return fallo(rpcId, -32002, 'Herramienta no permitida por el conector');
  }

  try {
    const salida = await handler(ctx, params.arguments);
    const info = resumenAccion(
      nombre,
      salida.ok,
      salida.ok ? salida.datos : null,
      salida.ok ? null : salida.mensaje
    );
    void registrarAccionMcp(
      ctx as RegistrarCtx,
      filaToken.id,
      nombre,
      info.proyecto,
      info.resumen
    ).catch(() => undefined);
    return resultadoTool(rpcId, salida);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return ok(rpcId, { content: [{ type: 'text', text: message }], isError: true });
  }
}

/** true si el conector (permisos del token) tiene habilitada la tool */
export function permitida(permisos: string[] | null, nombre: string): boolean {
  if (!permisos) return false;
  return permisos.includes(nombre);
}

function resultadoTool(rpcId: unknown, salida: SalidaTool): NextResponse {
  if (!salida.ok) {
    return ok(rpcId, { content: [{ type: 'text', text: salida.mensaje }], isError: true });
  }
  return ok(rpcId, {
    content: [{ type: 'text', text: JSON.stringify(salida.datos) }],
    isError: false
  });
}
