import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  esUuid,
  generarToken,
  hashToken,
  leerJson,
  leerNombreToken
} from '@/lib/captura';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** nunca se expone token_hash: el token plano solo existe en la respuesta POST */
const COLS_TOKEN = 'id,nombre,created_at,last_used_at';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { data, error } = await supabase
      .from('device_tokens')
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

    const nombre = leerNombreToken(await leerJson(request));
    if (nombre === null) {
      return NextResponse.json({ error: 'Nombre invalido' }, { status: 400 });
    }

    const token = generarToken();
    const { data, error } = await supabase
      .from('device_tokens')
      .insert({ nombre, token_hash: hashToken(token) })
      .select('id')
      .single();
    if (error) throw error;

    return NextResponse.json({ id: data.id, token }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const id = new URL(request.url).searchParams.get('id');
    if (!id || !esUuid(id)) {
      return NextResponse.json({ error: 'Token invalido' }, { status: 400 });
    }

    const { error } = await supabase.from('device_tokens').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
