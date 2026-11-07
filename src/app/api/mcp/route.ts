import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { leerBearerMt, buscarTokenAgente } from '@/lib/agentesServer';
import { HERRAMIENTAS_MCP } from '@/lib/mcp/catalogo';
import { dentroDeCupo, perfilCupo, registrarUso } from '@/lib/mcp/sesiones';
import { fallo, ok, llamadaTool } from '@/lib/mcp/respuesta';

/** servidor MCP (modulo 15): JSON-RPC 2.0 stateless. Auth Bearer mt_ por
 * peticion (sha256 -> worker_tokens via admin client); user_id SIEMPRE del
 * token, jamas del body. Cada query filtrada por user_id. Log + 60/min. */

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  let body: { id?: unknown; method?: unknown; params?: unknown };
  try {
    body = (await request.json()) as { id?: unknown; method?: unknown };
  } catch {
    return fallo(null, -32700, 'JSON invalido');
  }
  if (typeof body !== 'object' || body === null || typeof body.method !== 'string') {
    return fallo(null, -32600, 'Peticion JSON-RPC invalida');
  }
  const rpcId = 'id' in body ? body.id : null;
  const metodo: string = body.method;

  const admin = createAdminClient();
  const token = leerBearerMt(request.headers.get('Authorization'));
  const filaToken = token ? await buscarTokenAgente(admin, token) : null;
  if (!token || filaToken === null) {
    return fallo(rpcId, -32600, 'Token invalido', 401);
  }
  if (!dentroDeCupo(perfilCupo(token))) {
    return fallo(rpcId, -32600, 'Demasiadas peticiones', 429);
  }
  void registrarUso(admin, filaToken.id).catch(() => undefined);

  if (metodo.startsWith('notifications/')) {
    return new NextResponse(null, { status: 202 });
  }
  if (metodo === 'initialize') {
    return ok(rpcId, {
      protocolVersion: '2025-06-18',
      capabilities: { tools: {} },
      serverInfo: { name: 'mente', version: '1.0' }
    });
  }
  if (metodo === 'ping') return ok(rpcId, {});
  if (metodo === 'tools/list') return ok(rpcId, { tools: HERRAMIENTAS_MCP });
  if (metodo === 'tools/call') {
    return await llamadaTool(admin, filaToken, rpcId, body.params);
  }
  return fallo(rpcId, -32601, 'Metodo no encontrado');
}
