import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { mapConexionRow } from '@/lib/biblioteca';
import type { Conexion } from '@/lib/types';

/** UUID completo: evita inyeccion de sintaxis PostgREST en .or()/eq() */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** GET por item: ?id=<uuid idea> devuelve sus conexiones (en cualquier sentido) */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const ideaId = new URL(request.url).searchParams.get('id');
    if (!ideaId || !UUID_RE.test(ideaId)) {
      return NextResponse.json({ error: 'Falta el id del item' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('conexiones')
      .select('id,desde_id,hacia_id,nota,created_at')
      .or(`desde_id.eq.${ideaId},hacia_id.eq.${ideaId}`)
      .order('created_at');
    if (error) throw error;

    const conexiones: Conexion[] = (data ?? []).map(mapConexionRow);
    return NextResponse.json({ conexiones });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST conecta: desde el item actual hacia otro; duplicado -> 409 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = await request.json();
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });
    }
    const { desdeId, haciaId, nota } = (body ?? {}) as Record<string, unknown>;
    if (
      typeof desdeId !== 'string' ||
      typeof haciaId !== 'string' ||
      desdeId === haciaId ||
      !UUID_RE.test(desdeId) ||
      !UUID_RE.test(haciaId)
    ) {
      return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });
    }
    const notaOk =
      nota === undefined || nota === null
        ? null
        : typeof nota === 'string' && nota.trim().length > 0
          ? nota.trim().slice(0, 500)
          : undefined;
    if (notaOk === undefined) {
      return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('conexiones')
      .insert({ desde_id: desdeId, hacia_id: haciaId, nota: notaOk })
      .select('id,desde_id,hacia_id,nota,created_at')
      .single();
    if (error) {
      // UNIQUE (desde_id, hacia_id): prevencion de error, se avisa (spec §4)
      if ('code' in error && error.code === '23505') {
        return NextResponse.json({ error: 'Ya estan conectadas' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ conexion: mapConexionRow(data) }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE con ?id=<uuid conexion> */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const id = new URL(request.url).searchParams.get('id');
    if (!id || !UUID_RE.test(id)) {
      return NextResponse.json({ error: 'Falta el id' }, { status: 400 });
    }

    const { error } = await supabase.from('conexiones').delete().eq('id', id);
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
