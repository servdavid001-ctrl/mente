import { hashToken } from '@/lib/captura';
import { randomBytes } from 'node:crypto';
import type { SupabaseAdmin } from '@/utils/supabase/admin';

/** modulo 15: tokens de acceso para agentes (workers). Server-side solo:
 * el token plano mt_* se muestra una vez; en BD vive su hash SHA-256. */

export const TOKEN_PREFIJO_MT = 'mt_';

const BASE64URL_RE = /^[\w-]{40}$/;
export type FilaTokenAgente = {
  id: string;
  user_id: string;
  nombre: string;
  permisos: string[] | null;
};
export type TokenAgenteResultado = FilaTokenAgente | null;

/** token plano mt_ + 40 chars base64url */
export function generarTokenMt(): string {
  return `${TOKEN_PREFIJO_MT}${randomBytes(30).toString('base64url')}`;
}

/** Authorization: Bearer mt_xxx; null = header ausente/malformado */
export function leerBearerMt(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  if (!match) return null;
  const token = match[1];
  return token.startsWith(TOKEN_PREFIJO_MT) && token.length === TOKEN_PREFIJO_MT.length + 40
    ? token
    : null;
}

/** busca el token activo por hash (service_role); null = invalido/revocado */
export async function buscarTokenAgente(
  admin: SupabaseAdmin,
  token: string
): Promise<TokenAgenteResultado> {
  if (!BASE64URL_RE.test(token.slice(TOKEN_PREFIJO_MT.length))) return null;
  const { data, error } = await admin
    .from('worker_tokens')
    .select('id,user_id,nombre,permisos')
    .eq('token_hash', hashToken(token))
    .is('revocado_en', null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** nombre 1-40 chars (check de la tabla); null = invalido */
export function validarNombreAgente(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null;
  const bruto = (body as Record<string, unknown>).nombre;
  if (typeof bruto !== 'string') return null;
  const nombre = bruto.trim();
  return nombre.length >= 1 && nombre.length <= 40 ? nombre : null;
}

/** worker del token para asignado_a: loco si coincide, yo en otro caso */
export function normalizarWorker(nombre: string): string {
  return ['opencode', 'muse', 'grok'].includes(nombre) ? nombre : 'yo';
}
