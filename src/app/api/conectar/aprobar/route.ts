import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient, type SupabaseAdmin } from '@/utils/supabase/admin';
import { hashToken, leerJson } from '@/lib/captura';
import { generarTokenMt } from '@/lib/agentesServer';
import {
  buscarSolicitud,
  esDeviceCode,
  limpiarExpiradas,
  type SolicitudRow
} from '@/lib/loginSolicitudes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** modulo 18: paso 2 del CLI login (sesion del usuario). Autoriza o rechaza
 * la solicitud pendiente. Al autorizar crea el worker_token (patron modulo
 * 15) y guarda el plain SOLO en login_solicitudes (service_role) para que
 * poll lo entregue a la CLI: el token NUNCA pasa por el browser (esta
 * respuesta solo devuelve {estado}). */

type Body = { device_code?: unknown; aprobar?: unknown };

function yaProcesada(): NextResponse {
  return NextResponse.json({ error: 'Solicitud ya procesada o expirada' }, { status: 410 });
}

/** desaloja la claim si crear el token fallo; best-effort */
async function revertir(admin: SupabaseAdmin, id: string): Promise<void> {
  try {
    await admin
      .from('login_solicitudes')
      .update({ estado: 'pendiente', user_id: null })
      .eq('id', id);
  } catch {
    /* best-effort: el estado queda auditable en la fila */
  }
}

async function rechazar(
  admin: SupabaseAdmin,
  solicitud: SolicitudRow
): Promise<NextResponse> {
  const { data, error } = await admin
    .from('login_solicitudes')
    .update({ estado: 'rechazado' })
    .eq('id', solicitud.id)
    .eq('estado', 'pendiente')
    .select('id');
  if (error) throw error;
  if (!data || data.length === 0) return yaProcesada();
  return NextResponse.json({ estado: 'rechazado' });
}

async function aprobar(
  admin: SupabaseAdmin,
  userId: string,
  solicitud: SolicitudRow
): Promise<NextResponse> {
  const claim = await admin
    .from('login_solicitudes')
    .update({ estado: 'aprobado', user_id: userId })
    .eq('id', solicitud.id)
    .eq('estado', 'pendiente')
    .select('id');
  if (claim.error) throw claim.error;
  if (!claim.data || claim.data.length === 0) return yaProcesada();
  try {
    const token = generarTokenMt();
    const { data, error } = await admin
      .from('worker_tokens')
      .insert({ user_id: userId, nombre: solicitud.nombre, token_hash: hashToken(token) })
      .select('id')
      .single();
    if (error) throw error;
    const entrega = await admin
      .from('login_solicitudes')
      .update({ token_id: data.id, token })
      .eq('id', solicitud.id)
      .select('id');
    if (entrega.error) throw entrega.error;
  } catch (error: unknown) {
    await revertir(admin, solicitud.id);
    throw error;
  }
  return NextResponse.json({ estado: 'aprobado' });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = (await leerJson(request)) as Body | null;
    if (!esDeviceCode(body?.device_code)) {
      return NextResponse.json({ error: 'Device code invalido' }, { status: 400 });
    }
    if (typeof body!.aprobar !== 'boolean') {
      return NextResponse.json({ error: 'Aprobar invalido' }, { status: 400 });
    }
    void limpiarExpiradas(createAdminClient());

    const admin = createAdminClient();
    const solicitud = await buscarSolicitud(admin, body.device_code);
    if (!solicitud) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }
    if (solicitud.estado !== 'pendiente') return yaProcesada();
    if (solicitud.expira_en <= new Date().toISOString()) {
      return NextResponse.json({ error: 'Solicitud expirada' }, { status: 410 });
    }

    return body.aprobar
      ? await aprobar(admin, user.id, solicitud)
      : await rechazar(admin, solicitud);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
