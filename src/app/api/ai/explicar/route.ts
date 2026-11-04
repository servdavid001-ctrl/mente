import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { SELECT_IDEA, mapIdeaRow } from '@/lib/ideas';
import { chatStream, MENSAJE_AI_INDISPONIBLE, type ChatMsg } from '@/lib/ai/provider';
import { extraerPalabras } from '@/lib/ai/keywords';

/**
 * POST /api/ai/explicar (modulo 3): streaming (SSE del provider -> texto
 * plano) en 3 secciones cortas: que es / por que puede funcionarte / tecnica
 * o patron que usa. El hilo vive solo en el front (persistencia local al
 * cerrar): nada se guarda en DB. Sin keys ni contenido en logs.
 */

type Mensaje = { de: 'ai' | 'yo'; texto: string };

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const ideaId = typeof body?.ideaId === 'string' ? body.ideaId : '';
    if (!/^[0-9a-f-]{36}$/i.test(ideaId)) {
      return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });
    }
    const pregunta = typeof body?.pregunta === 'string' ? body.pregunta.slice(0, 4000) : '';
    const historial = Array.isArray(body?.historial)
      ? ((body.historial as unknown[])
          .filter(
            (m): m is Mensaje =>
              typeof m === 'object' && m !== null &&
              typeof (m as Mensaje).de === 'string' && typeof (m as Mensaje).texto === 'string'
          )
          .slice(-5) as Mensaje[])
      : [];

    const { data: bruta, error: errIdea } = await supabase
      .from('ideas')
      .select(SELECT_IDEA)
      .eq('id', ideaId)
      .single();
    if (errIdea) throw errIdea;
    const idea = mapIdeaRow(bruta);

    /* top 5 keywords de la biblioteca (contexto "conecta con lo tuyo") */
    const { data: otros, error: errOtros } = await supabase
      .from('ideas')
      .select('contenido,nota')
      .eq('estado', 'biblioteca')
      .neq('id', ideaId)
      .limit(60);
    if (errOtros) throw errOtros;
    const keywords = extraerPalabras(
      (otros ?? []).flatMap((o) => [o.contenido, o.nota]),
      5
    );

    const contexto = [
      `Titulo/contenido: ${idea.text || idea.sourceUrl || 'Nota de voz'}`,
      `Tipo: ${idea.kind}`,
      idea.nota ? `Nota del dueno: ${idea.nota.slice(0, 800)}` : '',
      idea.transcripcion ? `Transcripcion: ${idea.transcripcion.slice(0, 4000)}` : '',
      idea.entidades?.lista?.length
        ? `Entidades: ${idea.entidades.lista
            .slice(0, 10)
            .map((e) => `${e.tipo}:${e.nombre}`)
            .join(', ')}`
        : '',
      keywords.length
        ? `Palabras que dominan la biblioteca del dueno: ${keywords.join(', ')}`
        : ''
    ]
      .filter(Boolean)
      .join('\n');

    const mensajes: ChatMsg[] = [
      {
        role: 'system',
        content:
          'Eres la AI de Mente, app personal del usuario. Explicas en espanol, tono'
          + ' lectura calmada, sin listas ni emojis ni tildes (regla de render).'
          + ' Primera respuesta en 3 secciones cortas, cada una un parrafo cuyo'
          + ' inicio marca el titulo entre los literales "Que es", "Por que puede'
          + ' funcionarte" y "Tecnica o patron que usa". Seguimiento: respondes'
          + ' directo y corto. Usas el contexto del item y las palabras de su'
          + ' biblioteca para el bloque de conexion con lo tuyo.'
      },
      {
        role: 'user',
        content:
          (historial.length ? 'Historial reciente del hilo:\n' : '') +
          historial.map((m) => (m.de === 'ai' ? 'AI: ' : 'Yo: ') + m.texto.slice(0, 1000)).join('\n') +
          `Item a explicar:\n${contexto}` +
          (pregunta ? `\n\nPregunta del usuario: ${pregunta}` : '\n\nExplica el item.')
      }
    ];

    const cruda = await chatStream(mensajes);
    if (!cruda || !cruda.ok || !cruda.body) {
      /* sin provider disponible (sin key o region-blocked): mensaje claro,
       * sin detalles de key/region en el body */
      return NextResponse.json({ error: MENSAJE_AI_INDISPONIBLE }, { status: 503 });
    }
    if (cruda.status === 429) {
      return NextResponse.json(
        { error: 'Has usado tu analisis de hoy. Vuelve manana — tus ideas siguen intactas.' },
        { status: 429 }
      );
    }

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    const up = cruda.body.getReader();
    let buffer = '';
    const stream = new ReadableStream({
      async pull(controller) {
        for (;;) {
          const r = await up.read();
          if (r.done) {
            controller.close();
            return;
          }
          buffer += decoder.decode(r.value, { stream: true });
          const lineas = buffer.split('\n');
          buffer = lineas.pop() ?? '';
          let cambio = false;
          for (const linea of lineas) {
            if (!linea.startsWith('data:')) continue;
            const payload = linea.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            try {
              const json = JSON.parse(payload) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const trozo = json.choices?.[0]?.delta?.content;
              if (trozo) {
                controller.enqueue(encoder.encode(trozo));
                cambio = true;
              }
            } catch {
              /* linea parcial del provider: se salta sin romper el flujo */
            }
          }
          if (cambio) return;
        }
      }
    });
    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
