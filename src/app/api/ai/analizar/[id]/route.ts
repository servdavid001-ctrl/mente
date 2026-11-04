import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { mapIdeaRow, SELECT_IDEA } from '@/lib/ideas';
import {
  analizarItem,
  type SugerenciaNueva
} from '@/lib/ai/analizar';
import {
  SELECT_SUGERENCIA,
  LIMITE_DIA,
  analisisDeHoy,
  filtrarNuevas,
  mapSugerenciaRow,
  sugerenciasVivas
} from '@/lib/ai/sugerencias';
import { mapColeccionRow } from '@/lib/biblioteca';
import type { Coleccion, Idea, Sugerencia } from '@/lib/types';

/**
 * POST /api/ai/analizar/[id] (modulo 3): obtiene contenido del item (link con
 * fetch seguro / voz con whisper / texto), guarda transcripcion+entidades en
 * ideas y crea sugerencias pendientes (categoria, conexiones, minuta).
 * Rate diario single-user (audit P3-5). Sin keys ni contenido en logs.
 */
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { data: bruta, error: errIdea } = await supabase
      .from('ideas')
      .select(SELECT_IDEA)
      .eq('id', params.id)
      .single();
    if (errIdea) throw errIdea;
    const idea: Idea = mapIdeaRow(bruta);

    const [{ data: cols, error: errCols }, usados] = await Promise.all([
      supabase.from('colecciones').select('id,nombre,color').order('created_at'),
      analisisDeHoy(supabase)
    ]);
    if (errCols) throw errCols;
    if (usados >= LIMITE_DIA) {
      return NextResponse.json(
        { error: 'Has usado tu analisis de hoy. Vuelve manana — tus ideas siguen intactas.' },
        { status: 429 }
      );
    }
    const colecciones: Coleccion[] = (cols ?? []).map(mapColeccionRow);

    /* contenido y sugerencias nuevas (evita duplicar las vivas) */
    const resultado = await analizarItem(supabase, {
      id: idea.id,
      kind: idea.kind,
      text: idea.text,
      sourceUrl: idea.sourceUrl ?? null,
      transcripcion: idea.transcripcion ?? null
    }, colecciones);
    const vivas = await sugerenciasVivas(supabase, idea.id);
    const nuevas: SugerenciaNueva[] = filtrarNuevas(resultado.sugerencias, vivas);

    /* persistencia: transcripcion (link/voz: texto fetched) + entidades.
     * ai_minuta ya aceptada se conserva (minuta protegida, base mod 7) */
    const transcripcion = idea.kind === 'texto' ? null : resultado.contenido;
    const previa = idea.entidades ?? { lista: [] };
    const { error: errUpdate } = await supabase
      .from('ideas')
      .update({
        transcripcion,
        entidades: {
          ...previa,
          lista: resultado.entidades.length
            ? resultado.entidades
            : Array.isArray(previa.lista)
              ? previa.lista
              : []
        }
      })
      .eq('id', idea.id);
    if (errUpdate) throw errUpdate;

    if (nuevas.length > 0) {
      const { error: errIns } = await supabase
        .from('sugerencias')
        .insert(nuevas.map((n) => ({ idea_id: idea.id, tipo: n.tipo, payload: n.payload })));
      if (errIns) throw errIns;
    }

    const { data: todas, error: errS } = await supabase
      .from('sugerencias')
      .select(SELECT_SUGERENCIA)
      .eq('idea_id', idea.id)
      .in('estado', ['pendiente', 'aceptada']);
    if (errS) throw errS;
    const listado: Sugerencia[] = (todas ?? []).map(mapSugerenciaRow);

    return NextResponse.json({
      transcripcion,
      entidades: { lista: resultado.entidades },
      sugerencias: listado
    });
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : 'Error';
    if (mensaje === 'La transcripcion requiere una key de OpenAI') {
      return NextResponse.json({ error: mensaje }, { status: 409 });
    }
    if (mensaje === '_url_no_segura') {
      return NextResponse.json(
        { error: 'No pudimos abrir ese link de forma segura. Reintenta con otro.' },
        { status: 422 }
      );
    }
    if (mensaje === '_demasiado_grande') {
      return NextResponse.json(
        { error: 'El contenido es demasiado grande para transcribir (max 25MB).' },
        { status: 413 }
      );
    }
    if (mensaje.startsWith('_http_')) {
      return NextResponse.json(
        { error: 'No encontramos contenido en este link.' },
        { status: 422 }
      );
    }
    if (mensaje === 'No encontramos contenido en este link.')
      return NextResponse.json({ error: 'No encontramos contenido en este link.' }, { status: 422 });
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
