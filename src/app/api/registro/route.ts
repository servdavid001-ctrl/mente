import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  codigoCoincide,
  esEmailExistente,
  ipDe,
  normalizarEmail,
  passwordValida,
  permitirIntento
} from '@/lib/registro';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/registro: alta por codigo de invitacion.
 * No abre el signup publico de Supabase (disable_signup sigue en true):
 * el usuario se crea con service role solo si el codigo es correcto.
 */
export async function POST(request: Request) {
  try {
    const esperado = process.env.REGISTRO_INVITE_CODE;
    if (!esperado) {
      return NextResponse.json({ error: 'Registro no disponible' }, { status: 500 });
    }

    if (!permitirIntento(ipDe(request))) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta mas tarde.' },
        { status: 429 }
      );
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const email = normalizarEmail(body?.email);
    const password = body?.password;
    const codigo = body?.codigo;
    if (!email || !passwordValida(password) || typeof codigo !== 'string') {
      return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });
    }

    if (codigo.length > 256 || !codigoCoincide(codigo, esperado)) {
      return NextResponse.json({ error: 'Codigo de invitacion invalido' }, { status: 403 });
    }

    const { error } = await createAdminClient().auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (error) {
      if (esEmailExistente(error)) {
        return NextResponse.json({ error: 'Ese correo ya tiene cuenta' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error: unknown) {
    /* generico al cliente; nunca se registra body (password/codigo) */
    const message = error instanceof Error ? error.message : 'Error';
    console.error('[registro] fallo al crear usuario:', message);
    return NextResponse.json({ error: 'No pudimos crear la cuenta' }, { status: 500 });
  }
}
