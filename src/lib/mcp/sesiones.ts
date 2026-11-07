import { hashToken } from '@/lib/captura';
import type { SupabaseAdmin } from '@/utils/supabase/admin';

/** forma minima del contexto que necesita el log (sin ciclos de import) */
export type RegistrarCtx = {
  admin: SupabaseAdmin;
  userId: string;
  worker: string;
};

/** modulo 15: rate limit in-memory por token + log de acciones (sin
 * contenido sensible: solo meta de la operacion, resumen recortado a 200) */

const MAX_POR_MINUTO = 60;
const TOPE_MAPA = 2000;

type Ventana = { inicio: number; cuenta: number };
const ventanas = new Map<string, Ventana>();

/** true si la peticion del token entra dentro del cupo (60/min) */
export function dentroDeCupo(perfilToken: string): boolean {
  if (ventanas.size > TOPE_MAPA) purgar();
  const ahora = Date.now();
  const ventana = ventanas.get(perfilToken);
  if (!ventana || ahora - ventana.inicio >= 60000) {
    ventanas.set(perfilToken, { inicio: ahora, cuenta: 1 });
    return true;
  }
  if (ventana.cuenta >= MAX_POR_MINUTO) return false;
  ventana.cuenta += 1;
  return true;
}

function purgar(): void {
  const ahora = Date.now();
  for (const [clave, ventana] of ventanas) {
    if (ahora - ventana.inicio >= 60000) ventanas.delete(clave);
  }
}

/** inserta el log de la accion (fire, no interrumpe el flujo del tool) */
export async function registrarAccionMcp(
  ctx: RegistrarCtx,
  tokenId: string,
  accion: string,
  proyecto: string | null,
  resumen: string
): Promise<void> {
  await ctx.admin.from('token_acciones').insert({
    user_id: ctx.userId,
    token_id: tokenId,
    worker: ctx.worker,
    accion,
    proyecto,
    resumen: resumen.replace(/\u0000/g, '').slice(0, 200)
  });
}

/** refresco last_used_at (sin bloquear la respuesta) */
export async function registrarUso(admin: SupabaseAdmin, tokenId: string): Promise<void> {
  await admin
    .from('worker_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', tokenId);
}

/** perfil estable para el map del rate limit (el hash, nunca el token plano) */
export function perfilCupo(token: string): string {
  return hashToken(token);
}
