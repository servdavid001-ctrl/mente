/* modulo 14 (editor Notion): parser de markdown ligero por lineas. Puro y sin
 * React ni HTML: el render se hace con componentes (NUNCA
 * dangerouslySetInnerHTML). Soporta lo del alcance aprobado y nada mas:
 * # / ## / ### titulo - [ ] / [x] tarea - imagen por URL ([alt](url) o
 * !imagen(url), solo http(s)) - **negrita** - *cursiva*. Cualquier otra cosa
 * se muestra como texto plano literal. */

export type Bloque =
  | { tipo: 'titulo'; nivel: 1 | 2 | 3; texto: string }
  | { tipo: 'check'; hecho: boolean; texto: string }
  | { tipo: 'imagen'; url: string }
  | { tipo: 'parrafo'; texto: string };

export type Parte = { forma: 'texto' | 'negrita' | 'cursiva'; texto: string };

const TITULO_RE = /^(#{1,3})\s+(.+)$/;
const CHECK_RE = /^\[( |x|X)\]\s+(.+)$/;
const IMAGEN_MARK_RE = /^!\[[^\]]*\]\((.+)\)$/;
const IMAGEN_HINT_RE = /^!imagen\((.+)\)$/i;
const URL_IMG_RE = /^https?:\/\/\S+$/i;
const MARCAS_RE = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;

/** parsea el cuerpo (texto despues del titulo) en bloques por linea; las
 * lineas vacias se saltan (una linea = un bloque) */
export function parsearBloques(md: string): Bloque[] {
  const bloques: Bloque[] = [];
  for (const linea of md.split('\n')) {
    const recorte = linea.trim();
    if (recorte.length === 0) continue;
    const titulo = TITULO_RE.exec(recorte);
    if (titulo) {
      bloques.push({ tipo: 'titulo', nivel: titulo[1].length as 1 | 2 | 3, texto: titulo[2] });
      continue;
    }
    const check = CHECK_RE.exec(recorte);
    if (check) {
      bloques.push({ tipo: 'check', hecho: check[1] === 'x' || check[1] === 'X', texto: check[2] });
      continue;
    }
    const imagenUrl = imagenDe(recorte);
    if (imagenUrl !== null) {
      bloques.push({ tipo: 'imagen', url: imagenUrl });
      continue;
    }
    bloques.push({ tipo: 'parrafo', texto: recorte });
  }
  return bloques;
}

/** acepta !imagen(url) y ![alt](url); solo http(s); sin match valido = null
 * (la linea cae como parrafo literal, nunca se ejecuta) */
function imagenDe(linea: string): string | null {
  const m = IMAGEN_HINT_RE.exec(linea) ?? IMAGEN_MARK_RE.exec(linea);
  const url = m?.[1]?.trim() ?? '';
  if (URL_IMG_RE.test(url)) return url;
  return null;
}

/** separa el texto en partes de negrita/cursiva/texto plano; los marcadores
 * no cerrados quedan literales (determinista, sin regex greedy) */
export function partesInline(texto: string): Parte[] {
  const partes: Parte[] = [];
  let ultimo = 0;
  let m: RegExpExecArray | null = MARCAS_RE.exec(texto);
  while (m !== null) {
    if (m.index > ultimo) partes.push({ forma: 'texto', texto: texto.slice(ultimo, m.index) });
    if (m[1] !== undefined) partes.push({ forma: 'negrita', texto: m[1] });
    else partes.push({ forma: 'cursiva', texto: m[2] ?? '' });
    ultimo = MARCAS_RE.lastIndex;
    m = MARCAS_RE.exec(texto);
  }
  if (ultimo < texto.length) partes.push({ forma: 'texto', texto: texto.slice(ultimo) });
  return partes;
}
