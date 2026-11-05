import { createHash, randomBytes } from 'node:crypto';

/** modulo 5: contrato compartido de los tokens de captura por dispositivo */

export const TOKEN_PREFIJO = 'mente_';
export const MAX_URL = 2048;
export const MAX_MEDIA_BYTES = 10 * 1024 * 1024;

export const MIME_PERMITIDOS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
} as const;

export type MimePermitido = keyof typeof MIME_PERMITIDOS;

/** token plano: solo se muestra una vez; en BD vive su hash */
export function generarToken(): string {
  return `${TOKEN_PREFIJO}${randomBytes(32).toString('base64url')}`;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** nombre opcional del token: ausente -> 'extension'; invalido -> null */
export function leerNombreToken(body: unknown): string | null {
  const raw =
    typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>).nombre
      : undefined;
  if (raw === undefined || raw === null) return 'extension';
  if (typeof raw !== 'string') return null;
  const nombre = raw.trim();
  return nombre.length >= 1 && nombre.length <= 60 ? nombre : null;
}

/** Authorization: Bearer mente_... */
export function leerBearer(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  if (!match) return null;
  const token = match[1];
  if (!token.startsWith(TOKEN_PREFIJO)) return null;
  if (token.length <= TOKEN_PREFIJO.length || token.length > 200) return null;
  return token;
}

export function esHttp(valor: string | null): boolean {
  return valor !== null && valor.length <= MAX_URL && /^https?:\/\/\S+$/i.test(valor);
}

export function esUuid(valor: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    valor
  );
}

/** body JSON tolerante: invalido degenera en null (400 aguas arriba) */
export async function leerJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export type ArteDecodificado = {
  buffer: Buffer;
  mime: MimePermitido;
  ext: string;
};

/** acepta data URL o base64 puro; solo jpeg/png/webp hasta 10MB */
export function decodificarArte(
  mediaBase64: unknown,
  mediaMime: unknown
): ArteDecodificado | null {
  if (typeof mediaBase64 !== 'string') return null;
  let mime: string | null = null;
  let b64 = mediaBase64.trim();

  const match = /^data:([a-z]+\/[a-z0-9.+-]+);base64,(.+)$/i.exec(b64);
  if (match) {
    mime = match[1].toLowerCase();
    b64 = match[2];
  } else if (typeof mediaMime === 'string') {
    mime = mediaMime.trim().toLowerCase();
  }
  if (mime === null || !(mime in MIME_PERMITIDOS)) return null;

  b64 = b64.replace(/\s+/g, '');
  if (b64.length === 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) return null;

  const buffer = Buffer.from(b64, 'base64');
  if (buffer.length === 0 || buffer.length > MAX_MEDIA_BYTES) return null;

  return { buffer, mime: mime as MimePermitido, ext: MIME_PERMITIDOS[mime as MimePermitido] };
}
