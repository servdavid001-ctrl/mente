/**
 * Fetch externo SEGURO (audit del modulo 3): solo http/https con new URL(),
 * bloqueo SSRF de hosts internos, DNS validado y fijado en un Agent de undici
 * (anti-rebinding), redirect manual max 2 re-validado, timeout 10s y cap por
 * bytes (1MB html/texto, 25MB audio/video para Whisper).
 */

import { lookup } from 'node:dns/promises';
import { isIP, type LookupFunction } from 'node:net';
import { Agent, fetch as undiciFetch } from 'undici';
import { hostBloqueado, ipBloqueada, normalizarHost } from './ipSeguro';

export type Contenido = {
  clase: 'html' | 'audio' | 'video' | 'otros';
  contentType: string;
  bytes: ArrayBuffer | null;
};

type Direccion = { address: string; family: number };

const TIMEOUT_MS = 10_000;
const CAP_HTML = 1_048_576; /* ~1MB */
const CAP_MEDIA = 25 * 1_048_576; /* 25MB, contracto Whisper */
/* UA realista: Wikipedia y varios sitios devuelven 403 sin User-Agent */
const HEADERS_UA = {
  'User-Agent': 'Mozilla/5.0 (compatible; MenteBot/1.0)',
  Accept: 'text/html,application/xhtml+xml;q=0.9,text/plain;q=0.8,*/*;q=0.5'
};

/** valida esquema/host y resuelve DNS; devuelve solo direcciones ya seguras */
async function resolverDestino(u: URL): Promise<Direccion[] | null> {
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  const host = normalizarHost(u.hostname);
  if (hostBloqueado(host)) return null;
  const version = isIP(host);
  if (version === 4 || version === 6) {
    return ipBloqueada(host) ? null : [{ address: host, family: version }];
  }
  try {
    const ips = await lookup(host, { all: true, verbatim: true });
    if (ips.length === 0) return null;
    /* todas las respuestas DNS deben ser publicas (anti DNS mixto) */
    if (ips.some((ip) => ipBloqueada(ip.address))) return null;
    return ips.map((ip) => ({ address: ip.address, family: ip.family }));
  } catch {
    return null;
  }
}

/** valida esquema y host; null cuando la URL no es externa segura (SSRF) */
export async function urlExternaSegura(raw: string): Promise<URL | null> {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  return (await resolverDestino(u)) ? u : null;
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

/** Agent con lookup fijo a una IP ya validada: evita rebinding entre DNS y TCP */
function agenteFijado(destino: Direccion): Agent {
  const lookupFijado: LookupFunction = (_hostname, options, callback) => {
    /* Node puede pedir todas las direcciones (autoSelectFamily): se usa la fijada */
    if (options.all) callback(null, [{ address: destino.address, family: destino.family }]);
    else callback(null, destino.address, destino.family);
  };
  return new Agent({ connect: { lookup: lookupFijado } });
}

function urlDeRedirect(destino: string, base: URL): URL {
  try {
    return new URL(destino, base);
  } catch {
    throw new Error('_demasiados_redirects');
  }
}

/** descarga segura del contenido externo con redirects re-validados (max 2) */
export async function descargarSeguro(url: URL, saltosRestantes = 2): Promise<Contenido> {
  const destinos = await resolverDestino(url);
  if (!destinos) throw new Error('_url_no_segura');
  const control = new AbortController();
  const timer = setTimeout(() => control.abort(), TIMEOUT_MS);
  /* preferir IPv4 cuando exista: evita entornos sin ruta IPv6 */
  const fijada = destinos.find((d) => d.family === 4) ?? destinos[0];
  const agent = agenteFijado(fijada);
  try {
    const res = await undiciFetch(url, {
      redirect: 'manual',
      signal: control.signal,
      headers: HEADERS_UA,
      dispatcher: agent
    });
    const tipo = (res.headers.get('content-type') ?? '').toLowerCase();
    if (res.status >= 300 && res.status < 400) {
      if (saltosRestantes <= 0) throw new Error('_demasiados_redirects');
      const destino = res.headers.get('location');
      if (!destino) throw new Error('_demasiados_redirects');
      const siguiente = urlDeRedirect(destino, url);
      return descargarSeguro(siguiente, saltosRestantes - 1);
    }
    if (!res.ok) throw new Error(`_http_${res.status}`);
    const clase = claseDe(tipo);
    const cap = clase === 'html' || clase === 'otros' ? CAP_HTML : CAP_MEDIA;
    return {
      clase,
      contentType: tipo,
      bytes: await leerConCap(res.body as ReadableStream<Uint8Array> | null, cap)
    };
  } finally {
    clearTimeout(timer);
    await agent.close();
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
