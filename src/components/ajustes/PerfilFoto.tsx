'use client';

import { useRef } from 'react';
import { usePerfilFoto } from './usePerfilFoto';

/** Foto de perfil: vista previa, subir imagen (jpg/png/webp hasta 8 MB)
 * y reemplazar la anterior (upsert true). Mensaje Guardado al terminar. */
export default function PerfilFoto(props: { uid: string; fotoExt?: string | null; email?: string }) {
  const { url, subiendo, error, exito, subir } = usePerfilFoto({
    uid: props.uid,
    fotoExt: props.fotoExt
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const inicial = (props.email ?? 'M').charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-4">
      {url ? (
        // lint desactivado, mismo patron del modulo 17 (igual que PerfilSidebar)
        // eslint-disable-next-line @next/next/no-img-element
        <img
          loading="lazy"
          src={url}
          alt=""
          aria-hidden="true"
          className="h-16 w-16 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent-soft text-lg font-semibold text-accent-ink"
        >
          {inicial}
        </div>
      )}
      <div className="min-w-0">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          className="h-11 rounded-xl border border-[var(--border-control)] px-4 text-[13px] font-semibold text-text disabled:opacity-50"
        >
          {subiendo ? 'Subiendo...' : 'Cambiar foto'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          aria-label="Seleccionar foto de perfil"
          onChange={(e) => void subir(e.target.files?.[0] ?? null)}
        />
        <p className="mt-1 text-[12px] text-text-soft">Jpg, png o webp. Hasta 8 MB.</p>
        {exito ? (
          <p role="status" className="text-[13px] text-text">
            Guardado
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-[13px] text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
