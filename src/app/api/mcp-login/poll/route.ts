import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { leerJson } from '@/lib/captura';
import { buscarSolicitud, esDeviceCode, limpiarExpiradas } from '@/lib/loginSolicitudes';
import { claveIp, crearLimitador } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** modulo 18: paso 3 del CLI login. La CLI hace poll con el device_code
 * plain (PUBLICO con rate limit). pendiente -> pendiente; aprobado ->
 * {estado:'granted', token, user_id} UNA VEZ (pasa a 'entregado' y el
 * token plain se limpia); rechazado/entregado/expirado -> 410. */

const limitador = crearLimitador(240, 60 * 60 * 1000);

function finDeEstado(mensaje: string): NextResponse {
  return NextResponse.json({ error: mensaje }, { status: 410 });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    if (!limitador.permitir(claveIp(request))) {
      return NextResponse.json(
        { error: 'Demasiadas peticiones. Reintenta mas tarde.' },
        { status: 429 }
      );
    }

    const body = (await leerJson(request)) as Record<string, unknown> | null;
    if (!esDeviceCode(body?.device_code)) {
      return NextResponse.json({ error: 'Device code invalido' }, { status: 400 });
    }

    const admin = createAdminClient();
    void limpiarExpiradas(admin);
    const solicitud = await buscarSolicitud(admin, body.device_code);
    if (!solicitud) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    // pendiente expirada: fin honesto; la ladder ya la borro (best-effort)
    if (solicitud.estado === 'pendiente' && solicitud.expira_en <= new Date().toISOString()) {
      return finDeEstado('Solicitud expirada');
    }
    if (solicitud.estado === 'aprobado' && solicitud.token === null) {
      // ventana corta mientras aprobar prepara el token: aun no esta lista
      return NextResponse.json({ estado: 'pendiente' });
    }
    if (solicitud.estado === 'aprobado') {
      const { data, error } = await admin
        .from('login_solicitudes')
        .update({ estado: 'entregado', token: null })
        .eq('id', solicitud.id)
        .eq('estado', 'aprobado')
        .eq('token', solicitud.token)
        .select('id');
      if (error) throw error;
      if (!data || data.length === 0) return finDeEstado('Solicitud ya entregada');
      return NextResponse.json({
        estado: 'granted',
        token: solicitud.token,
        user_id: solicitud.user_id
      });
    }
    if (solicitud.estado === 'entregado') return finDeEstado('Solicitud ya entregada');
    if (solicitud.estado === 'rechazado') return finDeEstado('Solicitud rechazada');

    return NextResponse.json({ estado: 'pendiente' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
