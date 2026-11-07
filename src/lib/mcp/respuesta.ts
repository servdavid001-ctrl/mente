import { NextResponse } from 'next/server';
import type { SupabaseAdmin } from '@/utils/supabase/admin';
import { normalizarWorker } from '@/lib/agentesServer';
import { registrarAccionMcp, type RegistrarCtx } from '@/lib/mcp/sesiones';
import { MANEJADORES, resumenAccion } from '@/lib/mcp/despacho';
import { type CtxMcp, type SalidaTool } from '@/lib/mcp/comun';

/** helpers JSON-RPC del server MCP: envolturas ok/fallo y ejecucion de
 * tools/call con el log de acciones (resumen sin contenido sensible). */

type FilaToken = { id: string; user_id: string; nombre: string };

export function ok(id: unknown, result: unknown): NextResponse {
  return NextResponse.json({ jsonrpc: '2.0', id, result });
}

export function fallo(id: unknown, code: number, message: string, status = 200): NextResponse {
  return NextResponse.json({ jsonrpc: '2.0', id, error: { code, message } }, { status });
}

export async function llamadaTool(
  admin: SupabaseAdmin,
  filaToken: FilaToken,
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

function resultadoTool(rpcId: unknown, salida: SalidaTool): NextResponse {
  if (!salida.ok) {
    return ok(rpcId, { content: [{ type: 'text', text: salida.mensaje }], isError: true });
  }
  return ok(rpcId, {
    content: [{ type: 'text', text: JSON.stringify(salida.datos) }],
    isError: false
  });
}
