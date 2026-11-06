import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { mapIdeaRow, SELECT_IDEA } from '@/lib/ideas';
import { MENSAJE_AI_INDISPONIBLE } from '@/lib/ai/provider';
import {
  analizarItem,
  type SugerenciaNueva
} from '@/lib/ai/analizar';
import {
  SELECT_SUGERENCIA,
  filtrarNuevas,
  mapSugerenciaRow,
  sugerenciasVivas
} from '@/lib/ai/sugerencias';
import { mapColeccionRow } from '@/lib/biblioteca';
import { credencialesUsuario } from '@/lib/ai/credenciales';
import type { Coleccion, Idea, Sugerencia } from '@/lib/types';

/**
 * POST /api/ai/analizar/[id] (modulo 3): obtiene contenido del item (link con
 * fetch seguro / voz con whisper / texto), guarda transcripcion+entidades en
 * ideas y crea sugerencias pendientes (categoria, conexiones, minuta).
 * Rate atomico single-user via RPC consumir_analisis. Sin keys ni contenido en logs.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    /* rate atomico (security definer): se consume solo con sesion valida */
    const { data: permitido, error: errRate } = await supabase.rpc('consumir_analisis', {
      p_max: 50
    });
    if (errRate) throw errRate;
    if (permitido !== true) {
      return NextResponse.json(
        { error: 'Has usado tu analisis de hoy. Vuelve manana — tus ideas siguen intactas.' },
        { status: 429 }
      );
    }

    /* credenciales del usuario (o del entorno como fallback) */
    const credenciales = await credencialesUsuario(user.id);

    const { data: bruta, error: errIdea } = await supabase
      .from('ideas')
      .select(SELECT_IDEA)
      .eq('id', id)
      .single();
    if (errIdea) throw errIdea;
    const idea: Idea = mapIdeaRow(bruta);

    const { data: cols, error: errCols } = await supabase
      .from('colecciones')
      .select('id,nombre,color')
      .order('created_at');
    if (errCols) throw errCols;
    const colecciones: Coleccion[] = (cols ?? []).map(mapColeccionRow);

    /* contenido y sugerencias nuevas (evita duplicar las vivas) */
    const resultado = await analizarItem(supabase, {
      id: idea.id,
      kind: idea.kind,
      text: idea.text,
      sourceUrl: idea.sourceUrl ?? null,
      transcripcion: idea.transcripcion ?? null
    }, colecciones, credenciales);
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
    if (mensaje === MENSAJE_AI_INDISPONIBLE) {
      return NextResponse.json({ error: mensaje }, { status: 503 });
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
      const status = mensaje.replace('_http_', '');
      return NextResponse.json(
        { error: `No pudimos abrir el link (HTTP ${status}). Reintenta con otro.` },
        { status: 422 }
      );
    }
    if (mensaje === 'No encontramos contenido en este link.')
      return NextResponse.json({ error: 'No encontramos contenido en este link.' }, { status: 422 });
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
