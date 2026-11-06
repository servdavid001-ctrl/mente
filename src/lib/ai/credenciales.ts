import 'server-only';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  credencialDeProveedor,
  credencialesDeEntorno,
  type Credencial,
  type ProveedorIa
} from './provider';

/**
 * Credenciales AI por usuario (modulo 8). Se cifran en la app con
 * AES-256-GCM (clave = sha256(AI_KEY_SECRET)) antes de guardarse: la DB nunca
 * ve texto plano y la clave jamas viaja al cliente. Solo service_role lee la
 * tabla, siempre filtrando por user_id.
 */

export type EstadoCredencial = {
  configurada: boolean;
  origen: 'usuario' | 'entorno' | null;
  proveedor: ProveedorIa | null;
  last4: string | null;
  actualizado: string | null;
};

type FilaCredencial = {
  proveedor: string;
  key_cifrada: string;
  last4: string;
  updated_at: string | null;
};

const TABLA = 'ai_credenciales';
const CAMPOS = 'proveedor,key_cifrada,last4,updated_at';

function claveCifrado(): Buffer {
  const secreto = process.env.AI_KEY_SECRET?.trim();
  if (!secreto) throw new Error('AI_KEY_SECRET no configurado');
  return createHash('sha256').update(secreto, 'utf8').digest();
}

/** v2 liga el ciphertext al user_id (AAD): mover la fila a otro usuario no
 * permite reutilizar la credencial. v1 se sigue leyendo (legado). */
function cifrar(texto: string, userId: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', claveCifrado(), iv, { authTagLength: 16 });
  cipher.setAAD(Buffer.from(userId, 'utf8'));
  const datos = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v2.${iv.toString('base64url')}.${tag.toString('base64url')}.${datos.toString('base64url')}`;
}

function descifrar(guardado: string, userId: string): string {
  const [version, iv, tag, datos] = guardado.split('.');
  if ((version !== 'v1' && version !== 'v2') || !iv || !tag || !datos) {
    throw new Error('Credencial corrupta');
  }
  const decipher = createDecipheriv('aes-256-gcm', claveCifrado(), Buffer.from(iv, 'base64url'), {
    authTagLength: 16
  });
  if (version === 'v2') decipher.setAAD(Buffer.from(userId, 'utf8'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  const plano = Buffer.concat([decipher.update(Buffer.from(datos, 'base64url')), decipher.final()]);
  return plano.toString('utf8');
}

async function leerFila(userId: string): Promise<FilaCredencial | null> {
  const { data, error } = await createAdminClient()
    .from(TABLA)
    .select(CAMPOS)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as FilaCredencial | null) ?? null;
}

/** estado visible en /ajustes: propia si existe, si no la del entorno */
export async function estadoCredencial(userId: string): Promise<EstadoCredencial> {
  const fila = await leerFila(userId);
  if (fila) {
    /* si el secreto roto deja la credencial ilegible, se reporta como no
     * configurada: la UI pide reingresarla en vez de mentir */
    try {
      descifrar(fila.key_cifrada, userId);
      return {
        configurada: true,
        origen: 'usuario',
        proveedor: fila.proveedor as ProveedorIa,
        last4: fila.last4,
        actualizado: fila.updated_at ?? null
      };
    } catch {
      return { configurada: false, origen: null, proveedor: null, last4: null, actualizado: null };
    }
  }
  const entorno = credencialesDeEntorno();
  if (entorno.length > 0) {
    return {
      configurada: true,
      origen: 'entorno',
      proveedor: entorno[0].proveedor,
      last4: null,
      actualizado: null
    };
  }
  return { configurada: false, origen: null, proveedor: null, last4: null, actualizado: null };
}

/** credenciales para una request: la del usuario descifrada o, si no tiene,
 * las del entorno. Un descifrado fallido (secreto rotado/tamper) devuelve []
 * para no tumbar la request; el caller responde AI no disponible. */
export async function credencialesUsuario(userId: string): Promise<Credencial[]> {
  let fila: FilaCredencial | null = null;
  try {
    fila = await leerFila(userId);
  } catch {
    /* fallo del admin client/DB: no tumba la AI, cae al fallback de entorno */
    return credencialesDeEntorno();
  }
  if (!fila) return credencialesDeEntorno();
  try {
    const apiKey = descifrar(fila.key_cifrada, userId);
    return [credencialDeProveedor(fila.proveedor as ProveedorIa, apiKey)];
  } catch {
    return [];
  }
}

/** upsert por user_id; updated_at lo pone el trigger */
export async function guardarCredencial(
  userId: string,
  proveedor: ProveedorIa,
  apiKey: string
): Promise<void> {
  const keyCifrada = cifrar(apiKey, userId);
  const { error } = await createAdminClient()
    .from(TABLA)
    .upsert(
      { user_id: userId, proveedor, key_cifrada: keyCifrada, last4: apiKey.slice(-4) },
      { onConflict: 'user_id' }
    );
  if (error) throw error;
}

export async function borrarCredencial(userId: string): Promise<void> {
  const { error } = await createAdminClient().from(TABLA).delete().eq('user_id', userId);
  if (error) throw error;
}
