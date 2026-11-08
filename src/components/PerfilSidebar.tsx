'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/browser';

/** Bloque PERFIL del pie de la sidebar (paso 2 del rediseño David).
 * Datos: nombre en auth user_metadata.nombre; foto en el bucket
 * 'biblioteca-media' aparte <uid>/perfil.<ext> (foto_ext, la escribe paso 3).
 * La sidebar pide signed URL on demand: mismo patrón que MiniaturaArte.
 * Sin nombre guardado se usa la parte del correo antes del @. */
export default function PerfilSidebar(props: { email?: string }) {
  const [uid, setUid] = useState<string | null>(null);
  const [nombreGuardado, setNombreGuardado] = useState<string | null>(null);
  const [fotoExt, setFotoExt] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    createClient().auth.getUser().then(({ data }) => {
      if (!vivo || !data.user) return;
      const meta = data.user.user_metadata as {
        nombre?: string | null;
        foto_ext?: string | null;
      } | null;
      setUid(data.user.id);
      setNombreGuardado(typeof meta?.nombre === 'string' ? meta.nombre : null);
      setFotoExt(typeof meta?.foto_ext === 'string' ? meta.foto_ext : null);
    });
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    let vivo = true;
    if (!uid || !fotoExt) return;
    createClient()
      .storage.from('biblioteca-media')
      .createSignedUrl(`${uid}/perfil.${fotoExt}`, 300)
      .then(({ data }) => {
        if (vivo && data?.signedUrl) setUrl(data.signedUrl);
      });
    return () => {
      vivo = false;
    };
  }, [uid, fotoExt]);

  const correo = props.email ?? '';
  const nombre = nombreGuardado?.trim() || correo.split('@')[0] || 'Mi perfil';
  const inicial = nombre.charAt(0).toUpperCase();

  return (
    <div className="mt-auto border-t border-border px-4 py-4">
      <div className="flex items-center gap-3">
        {url ? (
          // patrón existente del repo (MiniaturaArte/LibCard): <img> con lint
          // desactivado, warning aceptado por la spec del modulo 17
          // eslint-disable-next-line @next/next/no-img-element
          <img
            loading="lazy"
            src={url}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[15px] font-semibold text-accent-ink"
          >
            {inicial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-text">{nombre}</p>
          <p className="truncate text-[11px] leading-snug text-text-soft">
            {correo || 'Sesion iniciada'}
          </p>
        </div>
        <Link
          href="/ajustes"
          aria-label="Ir a Ajustes"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-soft transition-colors hover:bg-accent-soft hover:text-accent-ink"
        >
          <svg
            viewBox="0 0 24 24" fill="none" aria-hidden="true"
            className="h-5 w-5" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
