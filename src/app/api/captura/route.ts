import { NextResponse } from 'next/server';
import { mapIdeaRow, SELECT_IDEA } from '@/lib/ideas';
import { hashToken, leerBearer, leerJson } from '@/lib/captura';
import { construirCaptura } from '@/lib/capturaServer';
import { createAdminClient, type SupabaseAdmin } from '@/utils/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** captura desde extension Chrome: Authorization: Bearer mente_... */
export async function POST(request: Request) {
  const token = leerBearer(request.headers.get('authorization'));
  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let admin: SupabaseAdmin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: 'Captura no disponible' }, { status: 500 });
  }

  try {
    const { data: dispositivo, error: errorToken } = await admin
      .from('device_tokens')
      .select('id,user_id')
      .eq('token_hash', hashToken(token))
      .maybeSingle();
    if (errorToken) throw errorToken;
    if (!dispositivo) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = String(dispositivo.user_id);
    await admin
      .from('device_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', dispositivo.id);

    const construida = await construirCaptura(admin, userId, await leerJson(request));
    if (construida === null) {
      return NextResponse.json({ error: 'Captura invalida' }, { status: 400 });
    }

    const { data, error } = await admin
      .from('ideas')
      .insert(construida.fila)
      .select(SELECT_IDEA)
      .single();

    if (error) {
      if (construida.ruta) {
        await admin.storage.from('biblioteca-media').remove([construida.ruta]);
      }
      throw error;
    }

    return NextResponse.json({ idea: mapIdeaRow(data) }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
