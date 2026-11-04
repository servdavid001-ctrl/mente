import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { mapIdeaRow, SELECT_IDEA } from '@/lib/ideas';
import { MAX_TEXTO } from '@/lib/biblioteca';
import type { Idea } from '@/lib/types';

const MAX_URL = 2048;

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const url = new URL(request.url);
    const estado = url.searchParams.get('estado');
    const pideArchivadas = url.searchParams.get('archivadas') === '1';
    // todas=1: incluye archivadas (el detalle va dentro de cada fila)
    const pideTodas = url.searchParams.get('todas') === '1';

    // fundamentacion (FOUNDATION punto 2): la Bandeja muestra categorizado o no,
    // por eso el default abraza bandeja + biblioteca; proyecto/investigacion
    // quedan fuera hasta el modulo 4
    const query = supabase
      .from('ideas')
      .select(SELECT_IDEA)
      .in('estado', estado === 'biblioteca' ? ['biblioteca'] : ['bandeja', 'biblioteca']);

    if (pideArchivadas) query.eq('estado', 'bandeja').eq('archivada', true);
    else if (!pideTodas) query.eq('archivada', false);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    const ideas: Idea[] = (data ?? []).map(mapIdeaRow);
    return NextResponse.json({ ideas });
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

    const body = await request.json();
    const row = buildInsertRow(body, user.id);
    if (row === null) {
      return NextResponse.json({ error: 'Datos de la idea invalidos' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('ideas')
      .insert(row)
      .select(SELECT_IDEA)
      .single();

    if (error) throw error;
    return NextResponse.json({ idea: mapIdeaRow(data) }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildInsertRow(body: unknown, userId: string): Record<string, unknown> | null {
  if (typeof body !== 'object' || body === null) return null;
  const { kind, text, sourceUrl } = (body ?? {}) as Record<string, unknown>;
  const urlStr = typeof sourceUrl === 'string' && sourceUrl.length > 0 ? sourceUrl : null;
  const texto = typeof text === 'string' ? text.trim() : '';

  if (kind === 'link') {
    // acepta la URL de sourceUrl o, como fallback, extraida de text
    const candidata = esHttp(urlStr)
      ? urlStr
      : esHttp(texto)
        ? texto
        : null;
    if (!candidata) return null;
    return { tipo: 'link', contenido: candidata, fuente: candidata };
  }
  if (kind === 'voz') {
    // ruta del audio en el bucket privado: <user_id>/<archivo> (cap 2048)
    if (!urlStr || urlStr.length > MAX_URL || !urlStr.startsWith(`${userId}/`)) return null;
    return { tipo: 'voz', contenido: null, audio_url: urlStr };
  }
  if (kind === 'texto') {
    if (texto.length === 0 || texto.length > MAX_TEXTO) return null; // P2-2 audit
    return {
      tipo: 'texto',
      contenido: texto,
      fuente: esHttp(urlStr) ? urlStr : null, // P2-3 audit
      audio_url: null
    };
  }
  return null;
}

function esHttp(url: string | null): boolean {
  return url !== null && url.length <= MAX_URL && /^https?:\/\/\S+$/i.test(url);
}
