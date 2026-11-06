import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { mapIdeaRow, SELECT_IDEA } from '@/lib/ideas';
import { MENSAJE_AI_INDISPONIBLE } from '@/lib/ai/provider';
import { buscarExternas, ERROR_SIN_ENTIDADES } from '@/lib/ai/externa';
import { credencialesUsuario } from '@/lib/ai/credenciales';
import { SELECT_SUGERENCIA, mapSugerenciaRow } from '@/lib/ai/sugerencias';

const ERROR_GENERICO = 'No pudimos buscar conexiones externas. Reintentar';

/**
 * POST /api/ai/externa/[id] (modulo 10, #5): lee las entidades autor|libro
 * que analizar ya guardo, pregunta Google Books + OpenLibrary (solo lectura,
 * timeout 5s) y hace LA UNICA llamada AI (frases + conceptos). Crea UNA
 * sugerencia de tipo 'externa' pendiente: nada se guarda en la idea hasta que
 * el usuario la acepte en /api/ai/sugerencias/[id]. No devolvemos errores de
 * PostgREST ni URLs del catalogo al cliente.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    /* mismo rate compartido del flujo de analisis (consumo unico por dia) */
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

    const credenciales = await credencialesUsuario(user.id);

    const { data: bruta, error: errIdea } = await supabase
      .from('ideas')
      .select(SELECT_IDEA)
      .eq('id', id)
      .single();
    if (errIdea) throw errIdea;
    const idea = mapIdeaRow(bruta);

    const items = await buscarExternas(
      { text: idea.text, transcripcion: idea.transcripcion, entidades: idea.entidades ?? { lista: [] } },
      credenciales
    );
    if (items.length === 0) {
      return NextResponse.json(
        { error: 'No encontramos conexiones externas para esta idea.' },
        { status: 422 }
      );
    }

    const { data: sugerencia, error: errIns } = await supabase
      .from('sugerencias')
      .insert({
        idea_id: idea.id,
        tipo: 'externa',
        payload: { items, generado: new Date().toISOString() }
      })
      .select(SELECT_SUGERENCIA)
      .single();
    if (errIns) throw errIns;
    return NextResponse.json({ sugerencia: mapSugerenciaRow(sugerencia) });
  } catch (error: unknown) {
    const mensaje = error instanceof Error ? error.message : 'Error';
    if (mensaje === MENSAJE_AI_INDISPONIBLE) {
      return NextResponse.json({ error: mensaje }, { status: 503 });
    }
    if (mensaje === ERROR_SIN_ENTIDADES) {
      return NextResponse.json(
        { error: 'Primero analiza esta idea: buscamos con las entidades ya detectadas.' },
        { status: 422 }
      );
    }
    /* generico: nunca detalles de PostgREST ni del catalogo (spec) */
    console.error('externa'); /* sin contenido ni keys */
    return NextResponse.json({ error: ERROR_GENERICO }, { status: 500 });
  }
}
