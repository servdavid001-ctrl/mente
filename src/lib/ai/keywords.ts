/** keywords y similitud lexica embedding-lite (modulo 3): overlap de palabras
 * relevantes entre items, sin embedding externo ni libreria nueva. */

const STOPWORDS = new Set([
  'este', 'esta', 'como', 'para', 'pero', 'donde', 'cuando', 'tambien', 'entre', 'sobre',
  'todos', 'todo', 'una', 'que', 'del', 'los', 'las', 'por', 'con', 'sus', 'mas', 'sin',
  'desde', 'hasta', 'eso', 'esa', 'esos', 'esas', 'the', 'and', 'with', 'from', 'that',
  'your', 'into', 'have', 'this', 'then', 'than', 'what', 'when', 'where', 'about'
]);

export function extraerPalabras(
  textos: Array<string | null | undefined>,
  max = 30
): string[] {
  const conteo = new Map<string, number>();
  for (const t of textos) {
    if (!t) continue;
    for (const palabra of t.toLowerCase().match(/[a-z0-9áéíóúñü]{4,}/g) ?? []) {
      if (STOPWORDS.has(palabra)) continue;
      conteo.set(palabra, (conteo.get(palabra) ?? 0) + 1);
    }
  }
  return Array.from(conteo.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([p]) => p);
}

/** devuelte las palabras compartidas entre dos vocabularios (orden de peso) */
export function palabrasCompartidas(a: string[], b: string[], max = 4): string[] {
  const setB = new Set(b);
  return a.filter((p) => setB.has(p)).slice(0, max);
}
