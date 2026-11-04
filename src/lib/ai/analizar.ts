/** Motor del analisis (modulo 3): obtiene el contenido del item, llama a la
 * AI una sola vez para categoria/entidades/pasos y arma sugerencias con
 * conexiones embedding-lite contra el resto de la biblioteca. */

import { descargarSeguro, extraerTextoHtml, urlExternaSegura } from './fetchSeguro';
import { transcribir, chat } from './provider';
import { extraerPalabras, palabrasCompartidas } from './keywords';
import { MAX_TEXTO } from '@/lib/biblioteca';
import type { Coleccion } from '@/lib/types';

export type SugerenciaNueva = { tipo: string; payload: Record<string, unknown> };
type SupabaseCliente = ReturnType<typeof import('@/utils/supabase/server').createClient>;

const CAP_PROMPT = 6000; /* bloque de contenido enviado al modelo */
const LIMITE_CONEXIONES = 4;
const CAP_MEDIA = 25 * 1_048_576; /* 25MB: contracto de transcription Whisper */

/** contenido del item: link (fetch seguro), voz (bucket firmado -> whisper),
 * texto (contenido). Errores tipados para el status de la route. */
export async function obtenerContenido(
  supabase: SupabaseCliente,
  idea: { kind: string; text: string; sourceUrl: string | null }
): Promise<string> {
  if (idea.kind === 'texto') return idea.text.slice(0, CAP_PROMPT);
  if (idea.kind === 'link') {
    if (!idea.sourceUrl) throw new Error('El item no tiene link');
    const url = urlExternaSegura(idea.sourceUrl);
    if (!url) throw new Error('_url_no_segura');
    const c = await descargarSeguro(url);
    if (c.clase === 'audio' || c.clase === 'video')
      return await transcribirBytes(c.bytes, `${url.hostname}.audio`);
    const texto = c.bytes ? extraerTextoHtml(new TextDecoder().decode(c.bytes)) : '';
    if (!texto) throw new Error('No encontramos contenido en este link.');
    return texto.slice(0, CAP_PROMPT);
  }
  /* voz: nota de audio del bucket privado -> whisper con key OpenAI */
  if (!idea.sourceUrl) throw new Error('El item no tiene audio');
  const { data, error } = await supabase.storage
    .from('ideas-audio')
    .createSignedUrl(idea.sourceUrl, 300);
  if (error || !data?.signedUrl) throw new Error('_sin_audio');
  const res = await fetch(data.signedUrl);
  if (!res.ok || !res.body) throw new Error('_sin_audio');
  const len = Number(res.headers.get('content-length') ?? '0');
  if (len > CAP_MEDIA) throw new Error('_demasiado_grande');
  return await transcribirBytes(await res.arrayBuffer(), `${idea.sourceUrl}.webm`);
}

async function transcribirBytes(bytes: ArrayBuffer | null, nombre: string): Promise<string> {
  if (!bytes || bytes.byteLength === 0) throw new Error('_demasiado_grande');
  try {
    const texto = await transcribir(bytes, nombre);
    if (texto === '') throw new Error('No encontramos contenido en este audio.');
    return texto;
  } catch (e: unknown) {
    const mensaje = e instanceof Error ? e.message : 'Error';
    if (/^AI-\d+/.test(mensaje))
      throw new Error('El servicio de transcripcion no respondio. Reintenta');
    throw e;
  }
}

type Inteligencia = {
  coleccion: { nombre: string } | null;
  entidades: Array<{ nombre: string; tipo: string }>;
  pasos: string[];
};

/** UNA llamada al modelo con salida JSON: categoria + entidades + pasos */
async function inteligenciaDe(texto: string, colecciones: Coleccion[]): Promise<Inteligencia> {
  const resp = await chat([
    {
      role: 'system',
      content:
        'Respondes SOLO JSON compacto sin markdown con las claves: coleccion (string,'
        + ' nombre de una coleccion existente de la lista o "NUEVO: nombre" si'
        + ' ninguna encaja, o null si no hay una buena), entidades (array max 10 de'
        + ' {nombre, tipo} con tipo en autor|libro|persona|lugar|marca|concepto),'
        + ' pasos (array de frases accionables si el contenido describe pasos o un'
        + ' plan, o null). Escribes en el idioma del contenido, sin tildes.'
    },
    {
      role: 'user',
      content:
        `Colecciones existentes del usuario: ${JSON.stringify(
          colecciones.map((c) => c.nombre)
        )}. Contenido:\n${texto}`
    }
  ]);
  if (!resp) throw new Error('Tu AI no respondio. Reintentar');
  return parseInteligencia(resp, colecciones);
}

function parseInteligencia(resp: string, colecciones: Coleccion[]): Inteligencia {
  const limpio = resp.replace(/```json|```/g, '').trim();
  let data: unknown;
  try {
    data = JSON.parse(limpio.slice(limpio.indexOf('{')));
  } catch {
    throw new Error('Tu AI no respondio. Reintentar');
  }
  const d = (data ?? {}) as Record<string, unknown>;
  const nombreCo = typeof d.coleccion === 'string' && d.coleccion ? d.coleccion : null;
  const coleccion = nombreCo
    ? {
        nombre: nombreCo
          .replace(/^NUEVO:\s*/i, '')
          .trim()
          .slice(0, 40)
      }
    : null;
  const tipos = new Set(['autor', 'libro', 'persona', 'lugar', 'marca', 'concepto']);
  const entidades = Array.isArray(d.entidades)
    ? (d.entidades as Array<Record<string, unknown>>)
        .filter(
          (e): e is { nombre: string; tipo: string } =>
            typeof e?.nombre === 'string' && tipos.has(String(e.tipo))
        )
        .slice(0, 10)
        .map((e) => ({ nombre: String(e.nombre).slice(0, 60), tipo: String(e.tipo) }))
    : [];
  const pasos = Array.isArray(d.pasos)
    ? (d.pasos as unknown[])
        .filter(
          (p): p is string => typeof p === 'string' && typeof p.trim() === 'string' && p.trim() !== ''
        )
        .slice(0, 10)
        .map((p) => p.trim().slice(0, 160))
    : [];
  return { coleccion: coleccion && coleccion.nombre ? coleccion : null, entidades, pasos };
}

/** analisis completo de un item ya cargado (RLS): contenido, inteligencia y
 * sugerencias enumorables contra la biblioteca. */
export async function analizarItem(
  supabase: SupabaseCliente,
  idea: {
    id: string;
    kind: string;
    text: string;
    sourceUrl: string | null;
    transcripcion: string | null;
  },
  colecciones: Coleccion[]
): Promise<{
  contenido: string;
  reaprovechado: boolean;
  entidades: Array<{ nombre: string; tipo: string }>;
  sugerencias: SugerenciaNueva[];
}> {
  let contenido: string;
  const reaprovechado = Boolean(idea.transcripcion);
  if (reaprovechado) {
    contenido = idea.transcripcion ?? '';
  } else {
    contenido = await obtenerContenido(supabase, {
      kind: idea.kind,
      text: idea.text,
      sourceUrl: idea.sourceUrl
    });
  }
  const int = await inteligenciaDe(contenido, colecciones);

  /* conexiones embedding-lite: keywords vs nota+contenido de items en biblioteca */
  const { data: otros, error: errOtros } = await supabase
    .from('ideas')
    .select('id,tipo,contenido,nota')
    .eq('estado', 'biblioteca')
    .neq('id', idea.id)
    .limit(60);
  if (errOtros) throw errOtros;
  const vocabulario = extraerPalabras([
    contenido,
    ...int.entidades.map((e) => e.nombre)
  ]);
  const propuestas = new Map<string, SugerenciaNueva>();
  for (const o of otros ?? []) {
    const compartidas = palabrasCompartidas(vocabulario, extraerPalabras([o.contenido, o.nota]));
    if (compartidas.length === 0) continue;
    propuestas.set(String(o.id), {
      tipo: 'conexion',
      payload: {
        haciaId: String(o.id),
        tituloItem: String(o.contenido ?? '').split('\n')[0].trim().slice(0, 80),
        tipo: String(o.tipo),
        motivo: `Comparten palabras: ${compartidas.join(', ')}`
      }
    });
  }

  const sugerencias: SugerenciaNueva[] = [];
  if (int.coleccion) sugerencias.push({ tipo: 'categoria', payload: { ...int.coleccion } });
  for (const p of Array.from(propuestas.values()).slice(0, LIMITE_CONEXIONES))
    sugerencias.push(p);
  if (int.pasos.length >= 2) sugerencias.push({ tipo: 'minuta', payload: { pasos: int.pasos } });
  return { contenido, reaprovechado, entidades: int.entidades, sugerencias };
}
