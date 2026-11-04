/** Validacion de hosts/IPs para SSRF: normalizacion y rangos no publicos. */

import { isIP } from 'node:net';

/** normaliza hostname: minusculas, sin punto final ni corchetes IPv6 */
export function normalizarHost(raw: string): string {
  let host = raw.trim().toLowerCase();
  if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1);
  return host.replace(/\.+$/, '');
}

/** rechaza localhost/metadata/sufijos internos e IPs literales no publicas */
export function hostBloqueado(host: string): boolean {
  if (!host) return true;
  if (host === 'localhost' || host === 'metadata') return true;
  if (host.endsWith('.local') || host.endsWith('.internal')) return true;
  return ipBloqueada(host);
}

export function ipBloqueada(raw: string): boolean {
  const ip = raw.replace(/^\[|\]$/g, '').toLowerCase();
  const version = isIP(ip);
  if (version === 4) return ipv4Bloqueada(ip);
  if (version === 6) return ipv6Bloqueada(ip);
  /* cadena con ':' que no parsea como IPv6 (zona, formato raro): se rechaza */
  return ip.includes(':');
}

function ipv4Bloqueada(ip: string): boolean {
  const [a, b, c] = ip.split('.').map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function ipv6Bloqueada(ip: string): boolean {
  const bytes = expandirIPv6(ip);
  if (!bytes) return true; /* no interpretable: se rechaza */
  if (bytes.every((b) => b === 0)) return true; /* :: */
  if (bytes.slice(0, 15).every((b) => b === 0) && bytes[15] === 1) return true; /* ::1 */
  if ((bytes[0] & 0xfe) === 0xfc) return true; /* fc00::/7 */
  if (bytes[0] === 0xfe && (bytes[1] & 0xc0) === 0x80) return true; /* fe80::/10 */
  if (bytes[0] === 0xff) return true; /* ff00::/8 */
  /* IPv4-mapped ::ffff:0:0/96: se valida la IPv4 embebida */
  const mapeada =
    bytes.slice(0, 10).every((b) => b === 0) &&
    bytes[10] === 0xff &&
    bytes[11] === 0xff;
  if (mapeada)
    return ipv4Bloqueada(`${bytes[12]}.${bytes[13]}.${bytes[14]}.${bytes[15]}`);
  return false;
}

function expandirIPv6(ip: string): number[] | null {
  const limpio = ip.split('%')[0].toLowerCase();
  const [cabeza, cola] = limpio.split('::');
  const gruposCabeza = grupos(cabeza);
  const gruposCola = cola === undefined ? null : grupos(cola);
  if (!gruposCabeza || (gruposCola === null && gruposCabeza.length !== 8)) return null;
  if (gruposCola) {
    const relleno = 8 - gruposCabeza.length - gruposCola.length;
    if (relleno < 1) return null;
    gruposCabeza.push(...Array(relleno).fill(0), ...gruposCola);
  }
  if (gruposCabeza.length !== 8) return null;
  return gruposCabeza.flatMap((g) => [(g >> 8) & 0xff, g & 0xff]);
}

function grupos(parte: string): number[] | null {
  if (parte === '') return [];
  const out: number[] = [];
  for (const t of parte.split(':')) {
    if (t.includes('.')) {
      const p = t.split('.').map(Number);
      if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255))
        return null;
      out.push((p[0] << 8) | p[1], (p[2] << 8) | p[3]);
    } else {
      if (!/^[0-9a-f]{1,4}$/.test(t)) return null;
      out.push(parseInt(t, 16));
    }
  }
  return out;
}
