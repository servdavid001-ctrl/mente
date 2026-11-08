import { randomBytes } from 'node:crypto';
import { hashToken } from '@/lib/captura';
import type { SupabaseAdmin } from '@/utils/supabase/admin';

/** modulo 18: solicitudes del CLI login (device flow) sobre
 * login_solicitudes (solo service_role; RLS sin policies). El device_code
 * plain vive SOLO en memoria/respuesta; en BD su sha256. El token mt_* plain
 * se guarda una vez (columna token) para entregarlo con poll; se limpia al
 * entregar (estado entregado) y nunca pasa por el browser UI. */

export const SEGUNDOS_EXPIRA = 15 * 60;
export const DEVICE_CODE_RE = /^[\w-]{43}$/;

export type SolicitudRow = {
  id: string;
  device_code: string;
  nombre: string;
  estado: string;
  user_id: string | null;
  token_id: string | null;
  token: string | null;
  expira_en: string;
};

const COLS = 'id,device_code,nombre,estado,user_id,token_id,token,expira_en';

/** device_code plain: base64url 32 bytes (43 chars, igual patron que mt_) */
export function generarDeviceCode(): string {
  return randomBytes(32).toString('base64url');
}

/** device_code plain valido; null si falta formato (43 base64url) */
export function esDeviceCode(valor: unknown): valor is string {
  return typeof valor === 'string' && DEVICE_CODE_RE.test(valor);
}

export function hashDeviceCode(plain: string): string {
  return hashToken(plain);
}

/** crea la solicitud pendiente; devuelve el device_code plain y su expira_en */
export async function crearSolicitud(
  admin: SupabaseAdmin,
  nombre: string
): Promise<{ deviceCode: string; expiraEn: string }> {
  const plain = generarDeviceCode();
  const expiraEn = new Date(Date.now() + SEGUNDOS_EXPIRA * 1000).toISOString();
  const { error } = await admin.from('login_solicitudes').insert({
    device_code: hashDeviceCode(plain),
    nombre,
    expira_en: expiraEn
  });
  if (error) throw error;
  return { deviceCode: plain, expiraEn };
}

/** lookup por hash del device_code plain; null = no existe */
export async function buscarSolicitud(
  admin: SupabaseAdmin,
  plain: string
): Promise<SolicitudRow | null> {
  const { data, error } = await admin
    .from('login_solicitudes')
    .select(COLS)
    .eq('device_code', hashDeviceCode(plain))
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** ladder limpieza (audit m18 CRÍTICO): pendientes expiradas se borraban, pero
 * las 'aprobado' sin recoger mantenian el TOKEN PLAIN a reposo por siempre.
 * ahora: 'aprobado' expirada => token=null (la ventana del plain queda
 * acotada) + entregadas/rechazadas viejas (>24h) se borran. best-effort */
export async function limpiarExpiradas(admin: SupabaseAdmin): Promise<void> {
  try {
    await admin
      .from('login_solicitudes')
      .delete()
      .eq('estado', 'pendiente')
      .lt('expira_en', new Date().toISOString());
    await admin
      .from('login_solicitudes')
      .update({ token: null })
      .eq('estado', 'aprobado')
      .lt('expira_en', new Date().toISOString());
    const hace = new Date(Date.now() - 86400000).toISOString();
    await admin
      .from('login_solicitudes')
      .delete()
      .in('estado', ['entregado', 'rechazado'])
      .lt('expira_en', hace);
  } catch {
    /* best-effort: sin fallo visible */
  }
}
