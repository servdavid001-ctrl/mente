import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { mapIdeaRow } from '@/lib/ideas';
import type { Idea } from '@/lib/types';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { data, error } = await supabase
      .from('ideas')
      .select('id,tipo,contenido,fuente,audio_url,created_at')
      .eq('estado', 'bandeja')
      .eq('archivada', false)
      .order('created_at', { ascending: false });

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
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = await request.json();
    const row = buildInsertRow(body);
    if (row === null) {
      return NextResponse.json({ error: 'Datos de la idea invalidos' }, { status: 400 });
    }

    const { data, error } = await supabase.from('ideas')
      .insert(row)
      .select('id,tipo,contenido,fuente,audio_url,created_at')
      .single();

    if (error) throw error;
    return NextResponse.json({ idea: mapIdeaRow(data) }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildInsertRow(body: unknown): Record<string, unknown> | null {
  if (typeof body !== 'object' || body === null) return null;
  const { kind, text, sourceUrl } = (body ?? {}) as Record<string, unknown>;
  const urlStr = typeof sourceUrl === 'string' && sourceUrl.length > 0 ? sourceUrl : null;
  const texto = typeof text === 'string' ? text.trim() : '';

  if (kind === 'link') {
    // acepta la URL de sourceUrl o, como fallback, extraida de text
    const candidata =
      urlStr && /^https?:\/\/\S+$/i.test(urlStr)
        ? urlStr
        : /^https?:\/\/\S+$/i.test(texto)
          ? texto
          : null;
    if (!candidata) return null;
    return { tipo: 'link', contenido: candidata, fuente: candidata };
  }
  if (kind === 'voz') {
    if (!urlStr) return null; // ruta del audio en el bucket: <user_id>/<archivo>
    return { tipo: 'voz', contenido: null, audio_url: urlStr };
  }
  if (kind === 'texto') {
    if (texto.length === 0) return null;
    return { tipo: 'texto', contenido: texto, fuente: urlStr && /^https?:\/\/\S+$/i.test(urlStr) ? urlStr : null, audio_url: null };
  }
  return null;
}
