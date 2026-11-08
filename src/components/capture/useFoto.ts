'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/browser';

export const ERROR_FOTO = 'No se pudo subir la foto. Reintenta.';

/** mime -> extension (foto en la bandeja, modulo 17): jpeg, png y webp */
const MIME_FOTO: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

/** cap de la spec m17 (menor que el cap de extension, 10 MB) */
const MAX_FOTO_BYTES = 8 * 1024 * 1024;

/** valida y sube la foto DIRECTO al bucket con la sesion del usuario
 * (supabase-js del browser; policies 0003 owner-folder ya lo permiten).
 * Ningun error individual: mensaje generico visible (spec m17). */
export function useFoto(onSend: (payload: MediaKeyPayload) => Promise<void>) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subir(file: File | null): Promise<boolean> {
    setError(null);
    if (!file) return false;
    const ext = MIME_FOTO[file.type];
    if (!ext || file.size === 0 || file.size > MAX_FOTO_BYTES) {
      setError(ERROR_FOTO);
      return false;
    }
    setSubiendo(true);
    try {
      const client = createClient();
      const { data: { user }, error: errUser } = await client.auth.getUser();
      if (errUser || !user) throw new Error('Sesion expirada');
      const ruta = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: errSubida } = await client.storage
        .from('biblioteca-media')
        .upload(ruta, file, { contentType: file.type, upsert: false });
      if (errSubida) throw errSubida;
      await onSend({ text: '', kind: 'arte', mediaKey: ruta });
      return true;
    } catch {
      setError(ERROR_FOTO);
      return false;
    } finally {
      setSubiendo(false);
    }
  }

  return { subir, subiendo, error, setError };
}

type MediaKeyPayload = { text: string; kind: 'arte'; mediaKey: string };
