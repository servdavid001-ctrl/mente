'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/browser';

/** miniatura de la foto en el card de la Bandeja (modulo 17, 48x64):
 * bucket privado -> signed URL on demand con la sesion del usuario (la select
 * policy owner-only de 0003 la autoriza; mismo patron de LibCard Cubierta).
 * Sin migraciones ni policies nuevas. Loading lazy + placeholder shimmer. */
export default function MiniaturaArte(props: { ruta: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    if (!props.ruta) return;
    createClient()
      .storage.from('biblioteca-media')
      .createSignedUrl(props.ruta, 300)
      .then(({ data }) => {
        if (vivo && data !== null) setUrl(data.signedUrl ?? null);
      });
    return () => {
      vivo = false;
    };
  }, [props.ruta]);

  if (!url) {
    return (
      <div
        aria-hidden="true"
        className="h-16 w-12 shrink-0 anim-shimmer rounded-card bg-gradient-to-r from-border via-surface to-border"
      />
    );
  }
  // patron existente del repo (LibCard Cubierta): <img> con lint desactivado,
  // warning aceptado por la spec del modulo 17
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      loading="lazy"
      src={url}
      alt=""
      aria-hidden="true"
      className="h-16 w-12 shrink-0 rounded-card object-cover"
    />
  );
}
