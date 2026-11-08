import type { PropuestaFundamento } from './tiposFundamento';

export type { PropuestaFundamento } from './tiposFundamento';

/* modulo 16 B (fundamento): parse estricto del JSON del modelo y caps
 * deterministas (spec: cap 2000 chars total). El draft NUNCA se guarda: la
 * route devuelve { propuesta } y la UI decide Crear/Descartar. */

/** prefijo del titulo de la pagina fundamento (regla v1: una sola por proyecto) */
export const PREFIJO_FUNDAMENTO = 'Fundamento - ';

/* caps de la propuesta: 300 (problema) + 3 x (4 x 110) + 300 (paso) = 1920,
 * siempre <= cap total 2000 de la spec por construccion */
const CAP_TEXTO = 300;
const CAP_ITEM = 110;
const MAX_ITEMS = 4;

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
