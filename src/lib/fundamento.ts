import { tituloIdea } from './foco';
import type { ChatMsg } from './ai/provider';
import type { Idea, Objetivo, Proyecto } from './types';

/* modulo 16 B (fundamento): contexto para el modelo, mensajes del prompt,
 * parse estricto del JSON y caps deterministas (spec: cap 2000 chars total).
 * El draft NUNCA se guarda: la route devuelve { propuesta } y la UI decide
 * Crear/Descartar. */

/** prefijo del titulo de la pagina fundamento (regla v1: una sola por proyecto) */
export const PREFIJO_FUNDAMENTO = 'Fundamento - ';

export type DatosFundamento = {
  nombre: string;
  descripcion: string | null;
  objetivos: string[];
  notas: string[];
};

export type PropuestaFundamento = {
  problema: string;
  debe_hacer: string[];
  no_debe: string[];
  criterio_exito: string[];
  siguiente_paso: string;
};

/* caps de la propuesta: 300 (problema) + 3 x (4 x 110) + 300 (paso) = 1920,
 * siempre <= cap total 2000 de la spec por construccion */
const CAP_TEXTO = 300;
const CAP_ITEM = 110;
const MAX_ITEMS = 4;
const MAX_OBJETIVOS = 4;
const MAX_NOTAS = 40;

const SYSTEM =
  'Eres un copiloto de proyectos; con estos datos del proyecto construye un '
  + 'documento fundacional claro. Respondes SOLO JSON compacto sin markdown '
  + 'con las claves: problema (string, el problema central), debe_hacer '
  + '(array de hasta 4 frases accionables), no_debe (array de hasta 4 cosas '
  + 'que NO hay que hacer), criterio_exito (array de hasta 4 criterios '
  + 'verificables), siguiente_paso (string). Escribes en espanol, sin tildes, '
  + 'concreto y corto.';

/** contexto ligero para el modelo: proyecto + objetivos activos + notas */
export function datosFundamento(detalle: {
  proyecto: Proyecto;
  objetivos: Objetivo[];
  ideas: Idea[];
}): DatosFundamento {
  return {
    nombre: detalle.proyecto.nombre,
    descripcion: detalle.proyecto.descripcion ?? null,
    objetivos: detalle.objetivos
      .filter((o) => o.estado === 'activo')
      .slice(0, MAX_OBJETIVOS)
      .map((o) =>
        `${o.titulo}${o.descripcion ? `: ${o.descripcion.slice(0, 300)}` : ''}`
      ),
    notas: detalle.ideas.slice(0, MAX_NOTAS).map((i) => {
      const nota = i.nota ? `: ${i.nota.slice(0, 200)}` : '';
      return `${tituloIdea(i).slice(0, 120)}${nota}`;
    })
  };
}

/** mensajes de la UNICA llamada al provider (patron analizar/explicar) */
export function mensajesFundamento(datos: DatosFundamento): ChatMsg[] {
  const bloques = [
    `Proyecto: ${datos.nombre.slice(0, 200)}`,
    datos.descripcion ? `Descripcion: ${datos.descripcion.slice(0, 800)}` : '',
    datos.objetivos.length
      ? `Objetivos activos:\n- ${datos.objetivos.join('\n- ').slice(0, 2000)}`
      : '',
    datos.notas.length
      ? `Notas del proyecto:\n- ${datos.notas.join('\n- ').slice(0, 3400)}`
      : '',
    'Si falta contexto, propone lo esencial partiendo de cero; no inventes datos internos.'
  ].filter(Boolean);
  const contexto = bloques.join('\n').slice(0, 6000);
  return [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: `Datos del proyecto:\n${contexto}` }
  ];
}

/** parse del JSON del modelo (acepta cercas ```json); null = inutilizable */
export function propuestaDe(respuesta: string | null): PropuestaFundamento | null {
  if (!respuesta) return null;
  const limpio = respuesta.replace(/```[a-z]*|```/g, '').trim();
  const inicio = limpio.indexOf('{');
  if (inicio < 0) return null;
  let data: unknown;
  try {
    data = JSON.parse(limpio.slice(inicio));
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;
  const problema = texto(d.problema);
  if (!problema) return null;
  return {
    problema: problema.slice(0, CAP_TEXTO),
    debe_hacer: lista(d.debe_hacer),
    no_debe: lista(d.no_debe),
    criterio_exito: lista(d.criterio_exito),
    siguiente_paso: (texto(d.siguiente_paso) ?? '').slice(0, CAP_TEXTO)
  };
}

function lista(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .filter((p): p is string => typeof p === 'string' && p.trim() !== '')
    .slice(0, MAX_ITEMS)
    .map((p) => p.replace(/^[*-]\s*/, '').trim().slice(0, CAP_ITEM));
}

function texto(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() !== '' ? valor.trim() : null;
}
