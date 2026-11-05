import { randomUUID } from 'node:crypto';
import { decodificarArte, esHttp } from './captura';
import type { SupabaseAdmin } from '@/utils/supabase/admin';

/** sube el screenshot al bucket y devuelve la fila de idea tipo arte */
export async function construirArte(
  admin: SupabaseAdmin,
  datos: Record<string, unknown>,
  userId: string
): Promise<{ fila: Record<string, unknown>; ruta: string } | null> {
  const arte = decodificarArte(datos.mediaBase64, datos.mediaMime);
  if (arte === null) return null;

  const ruta = `${userId}/${randomUUID()}.${arte.ext}`;
  const { error } = await admin.storage
    .from('biblioteca-media')
    .upload(ruta, arte.buffer, { contentType: arte.mime, upsert: false });
  if (error) throw error;

  const fuenteRaw = typeof datos.fuente === 'string' ? datos.fuente.trim() : '';
  return {
    ruta,
    fila: {
      user_id: userId,
      tipo: 'arte',
      contenido: null,
      fuente: esHttp(fuenteRaw) ? fuenteRaw : null,
      estado: 'biblioteca',
      media_url: ruta
    }
  };
}
