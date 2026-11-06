/** LA UNICA llamada AI del modulo 10 (spec): propaga conceptos/corrientes
 * relacionados (sin autor ni portada) y una frase de 1 linea por ficha de
 * libro que ya detecto la idea ("por que te serviria leerlo"). Sin textos
 * largos, en el idioma del contenido, sin tildes. */

import { chat } from './provider';
import type { Credencial } from './provider';

import type { Entidad, ItemExterno } from '@/lib/types';

const MAX_ITEMS = 12;

type Respuesta = {
  conceptual?: unknown;
  frases?: unknown;
};

/** enriquece las fichas del catalogo y agrega hasta 2 matches conceptuales;
 * devuelve la lista final limitada a 12 items. */
export async function enriquecerAI(
  fichas: ItemExterno[],
  entidades: Entidad[],
  contenido: string,
  credenciales: Credencial[]
): Promise<ItemExterno[]> {
  const base = fichas.slice(0, 10);
  if (credenciales.length === 0) return base; /* catalogo sin clave: fichas secas */
  const constexto = bloqueFichas(base);
  const resp = await chat([
    {
      role: 'system',
      content:
        'Respondes SOLO JSON compacto sin markdown con las claves: frases (array max 10'
        + ' de {i, frase}: para la ficha numero i explica en UNA frase sin tildes,'
        + ' max 160 chars, por que te serviria ese libro o autor para tu idea) y'
        + ' conceptual (array max 2 de {titulo}: conceptos, corrientes o metodos'
        + ' relacionados, sin autor ni portada). Escribes en el idioma del contenido.'
    },
    {
      role: 'user',
      content:
        `Idea: ${contenido.slice(0, 1500)}\nEntidades reconocidas: ${JSON.stringify(
          entidades.map((e) => `${e.tipo}: ${e.nombre}`)
        )}\nFichas del catalogo (titulo, autor, anio):\n${constexto}`
    }
  ], credenciales);
  if (!resp) throw new Error('Tu AI no respondio. Reintentar');
  return aplicar(resp, base);
}

function bloqueFichas(base: ItemExterno[]): string {
  return base
    .map((f, i) => `${i}: ${JSON.stringify([f.titulo, f.autor, f.anio])}`)
    .join('\n');
}

function parse(resp: string): Respuesta {
  const limpio = resp.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(limpio.slice(limpio.indexOf('{'))) as Respuesta;
  } catch {
    throw new Error('Tu AI no respondio. Reintentar');
  }
}

/** aplica frases por indices validos y agrega los conceptos al final */
function aplicar(resp: string, base: ItemExterno[]): ItemExterno[] {
  const d = parse(resp);
  const conFrase = [...base];
  if (Array.isArray(d.frases)) {
    for (const bruto of d.frases as unknown[]) {
      const f = bruto as Record<string, unknown>;
      const i = Number(f?.i);
      const frase = typeof f?.frase === 'string' ? f.frase.trim().slice(0, 160) : '';
      if (Number.isInteger(i) && i >= 0 && i < conFrase.length && frase !== '') {
        conFrase[i] = { ...conFrase[i], frase };
      }
    }
  }
  const conceptos = Array.isArray(d.conceptual)
    ? (d.conceptual as Record<string, unknown>[])
        .map((c) => ({
          fuente: 'ai' as const,
          titulo: typeof c?.titulo === 'string' ? c.titulo.trim().slice(0, 100) : '',
          autor: null,
          anio: null,
          coverUrl: null,
          url: null,
          frase: null
        }))
        .filter((c) => c.titulo !== '')
    : [];
  return [...conFrase, ...conceptos].slice(0, MAX_ITEMS);
}
