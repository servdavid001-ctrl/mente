'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/browser';

/** mime -> extension (mismo mapa que useFoto del modulo 17) */
const MIME_FOTO: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};
/** cap 8 MB del paso 3 del rediseno */
const MAX_FOTO_BYTES = 8 * 1024 * 1024;
const ERROR_TAMANO = 'Foto no valida. Usa jpg, png o webp de hasta 8 MB.';

function traducirError(mensaje: string): string {
  const texto = mensaje.toLowerCase();
  if (texto.includes('session') || texto.includes('not authenticated')) {
    return 'Tu sesion caduco. Vuelve a entrar.';
  }
  return 'No se pudo subir la foto. Reintenta.';
}

/** Logica de la foto de perfil: signed URL para la vista previa (patron
 * PerfilSidebar), subir al bucket <uid>/perfil.<ext> con upsert y guardar
 * foto_ext en user_metadata con updateUser. */
export function usePerfilFoto(props: { uid: string; fotoExt?: string | null }) {
  const [fotoExt, setFotoExt] = useState(props.fotoExt ?? null);
  const [url, setUrl] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    let vivo = true;
    if (!fotoExt) return;
    createClient()
      .storage.from('biblioteca-media')
      .createSignedUrl(`${props.uid}/perfil.${fotoExt}`, 300)
      .then(({ data }) => {
        if (vivo && data?.signedUrl) setUrl(data.signedUrl);
      });
    return () => {
      vivo = false;
    };
  }, [props.uid, fotoExt]);

  async function subir(file: File | null) {
    if (!file || subiendo) return;
    setError(null);
    setExito(false);
    const ext = MIME_FOTO[file.type];
    if (!ext || file.size === 0 || file.size > MAX_FOTO_BYTES) {
      setError(ERROR_TAMANO);
      return;
    }
    setSubiendo(true);
    try {
      const client = createClient();
      const { error: errSubida } = await client.storage
        .from('biblioteca-media')
        .upload(`${props.uid}/perfil.${ext}`, file, { contentType: file.type, upsert: true });
      if (errSubida) throw errSubida;
      const { error: errPerfil } = await client.auth.updateUser({ data: { foto_ext: ext } });
      if (errPerfil) throw errPerfil;
      setFotoExt(ext);
      setExito(true);
    } catch (err: unknown) {
      setError(traducirError(err instanceof Error ? err.message : ''));
    } finally {
      setSubiendo(false);
    }
  }

  return { url, subiendo, error, exito, subir };
}
