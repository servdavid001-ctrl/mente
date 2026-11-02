/**
 * Fetch externo SEGURO (audit del modulo 3): solo http/https con new URL(),
 * bloqueo SSRF de hosts internos, redirect manual max 2 re-validado, timeout
 * 10s y cap por bytes (1MB html/texto, 25MB audio/video para Whisper).
 */

export type Contenido = {
  clase: 'html' | 'audio' | 'video' | 'otros';
  contentType: string;
  bytes: ArrayBuffer | null;
};

const TIMEOUT_MS = 10_000;
const CAP_HTML = 1_048_576; /* ~1MB */
const CAP_MEDIA = 25 * 1_048_576; /* 25MB, contracto Whisper */

function ipInterna(raw: string): boolean {
  const p = raw.split('.').map((n) => Number(n));
  if (p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  if (p[0] === 127 || p[0] === 10) return true;
  if (p[0] === 192 && p[1] === 168) return true;
  if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true;
  if (p[0] === 169 && p[1] === 254) return true; /* link local */
  return false;
}

/** valida esquema y host; null cuando la URL no es externa segura (SSRF) */
export function urlExternaSegura(raw: string): URL | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  const host = u.hostname.toLowerCase();
  if (host === '' || host === 'localhost') return null;
  if (host.endsWith('.local') || host.endsWith('.internal') || host === 'metadata') return null;
  if (ipInterna(host)) return null;
  if (host === '::1' || host === '[::1]' || host.startsWith('fe80') || host.startsWith('fc') || host.startsWith('fd'))
    return null;
  return u;
}

/** lectura con cap: acumula hasta el limite y aborta el reader (sin bucle infinito) */
async function leerConCap(
  body: ReadableStream<Uint8Array> | null,
  cap: number
): Promise<ArrayBuffer | null> {
  if (!body) return null;
  const reader = body.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const r = await reader.read();
    if (r.done) break;
    total += r.value.byteLength;
    if (total > cap) {
      void reader.cancel();
      throw new Error('_demasiado_grande');
    }
    partes.push(r.value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of partes) {
    out.set(p, offset);
    offset += p.byteLength;
  }
  return out.buffer;
}

function claseDe(tipo: string): Contenido['clase'] {
  if (tipo.startsWith('text/html') || tipo.startsWith('text/plain')) return 'html';
  if (tipo.startsWith('audio/')) return 'audio';
  if (tipo.startsWith('video/')) return 'video';
  return 'otros';
}

/** descarga segura del contenido externo con redirects re-validados (max 2) */
export async function descargarSeguro(url: URL, saltosRestantes = 2): Promise<Contenido> {
  const control = new AbortController();
  const timer = setTimeout(() => control.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { redirect: 'manual', signal: control.signal });
    const tipo = (res.headers.get('content-type') ?? '').toLowerCase();
    if (res.status >= 300 && res.status < 400) {
      if (saltosRestantes <= 0) throw new Error('_demasiados_redirects');
      const destino = res.headers.get('location');
      if (!destino) throw new Error('_demasiados_redirects');
      const siguiente = urlExternaSegura(new URL(destino, url).href);
      if (!siguiente) throw new Error('_url_no_segura');
      return descargarSeguro(siguiente, saltosRestantes - 1);
    }
    if (!res.ok) throw new Error(`_http_${res.status}`);
    const clase = claseDe(tipo);
    const cap = clase === 'html' || clase === 'otros' ? CAP_HTML : CAP_MEDIA;
    return { clase, contentType: tipo, bytes: await leerConCap(res.body, cap) };
  } finally {
    clearTimeout(timer);
  }
}

/** extractor de texto plano de HTML sin DOM: quita script/style/etiquetas y
 * decodifica entidades basicas; regex apotropaicas (audit: sin innerHTML) */
export function extraerTextoHtml(html: string, maxChars = 12_000): string {
  const limpio = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_m, n: string) => String.fromCharCode(Number(n) || 32));
  return limpio.replace(/\s+/g, ' ').trim().slice(0, maxChars) || '';
}
