import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { validarNombreAgente } from '@/lib/agentesServer';
import { leerJson } from '@/lib/captura';
import { crearSolicitud, SEGUNDOS_EXPIRA } from '@/lib/loginSolicitudes';
import { claveIp, crearLimitador } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** modulo 18: paso 1 del CLI login (device flow). PUBLICO con rate limit.
 * Crea la solicitud pendiente y devuelve {device_code, url, expira_en};
 * el device_code plain SOLO vive en esta respuesta (en BD va su sha256). */

const limitador = crearLimitador(20, 60 * 60 * 1000);

export async function POST(request: Request): Promise<NextResponse> {
  try {
    if (!limitador.permitir(claveIp(request))) {
      return NextResponse.json(
        { error: 'Demasiadas peticiones. Reintenta mas tarde.' },
        { status: 429 }
      );
    }

    const nombre = validarNombreAgente(await leerJson(request));
    if (nombre === null) {
      return NextResponse.json({ error: 'Nombre invalido' }, { status: 400 });
    }

    const admin = createAdminClient();
    const creada = await crearSolicitud(admin, nombre);
    const url = new URL(request.url);
    return NextResponse.json(
      {
        device_code: creada.deviceCode,
        url: `${url.origin}/conectar?device=${creada.deviceCode}`,
        expira_en: SEGUNDOS_EXPIRA
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
