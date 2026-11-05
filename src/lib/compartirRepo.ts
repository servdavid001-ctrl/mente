import type { MediaCompartir } from './compartir';
import type { createClient } from '@/utils/supabase/server';

export type Cliente = Awaited<ReturnType<typeof createClient>>;

/** el proyecto solo se vincula si el uuid existe y es del usuario */
export async function proyectoPropio(
  supabase: Cliente,
  userId: string,
  proyecto: string | null
): Promise<string | null> {
  if (proyecto === null) return null;
  const { data, error } = await supabase
    .from('proyectos')
    .select('id')
    .eq('id', proyecto)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? String(data.id) : null;
}

/** misma convencion del bucket: <user_id>/<uuid>.<ext> */
export async function subirMedia(
  supabase: Cliente,
  userId: string,
  media: MediaCompartir
): Promise<string> {
  const ruta = `${userId}/${crypto.randomUUID()}.${media.ext}`;
  const { error } = await supabase.storage
    .from('biblioteca-media')
    .upload(ruta, media.buffer, { contentType: media.mime, upsert: false });
  if (error) throw error;
  return ruta;
}

export async function insertarIdea(
  supabase: Cliente,
  fila: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from('ideas').insert(fila);
  if (error) throw error;
}
