import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { esUuid } from '@/lib/foco';
import { hashToken, leerJson } from '@/lib/captura';
import {
  generarTokenMt,
  validarNombreAgente
} from '@/lib/agentesServer';

/** tokens de acceso para agentes: crear una vez, listar, revocar (logico).
 * El token plano solo se devuelve en el POST y jamas vuelve a verse. */

const COLS_TOKEN = 'id,nombre,created_at,last_used_at,revocado_en';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { data, error } = await supabase
      .from('worker_tokens')
      .select(COLS_TOKEN)
      .order('created_at', { ascending: false });
    if (error) throw error;

    return NextResponse.json({ tokens: data ?? [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const nombre = validarNombreAgente(await leerJson(request));
    if (nombre === null) {
      return NextResponse.json({ error: 'Nombre invalido' }, { status: 400 });
    }

    const token = generarTokenMt();
    const fila = { nombre, token_hash: hashToken(token) };
    const { data, error } = await supabase
      .from('worker_tokens')
      .insert(fila)
      .select('id')
      .single();
    if (error) throw error;

    return NextResponse.json({ id: data.id, token }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** revocacion logica (PUT interno de revocado_en = now); nada fisico */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const id = new URL(request.url).searchParams.get('id');
    if (!id || !esUuid(id)) {
      return NextResponse.json({ error: 'Token invalido' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('worker_tokens')
      .update({ revocado_en: new Date().toISOString() })
      .eq('id', id)
      .is('revocado_en', null)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Token no existe o ya revocado' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
