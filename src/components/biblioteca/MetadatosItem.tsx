'use client';

import { useRef } from 'react';
import type { Coleccion, Idea } from '@/lib/types';
import { relativeTime } from '@/lib/time';
import { ETIQUETAS_TIPO } from '@/lib/biblioteca';
import { Dot } from './ColeccionChip';

/** fila tipo + fecha completa + origen + chips de colecciones (spec §4) */
export default function MetadatosItem(props: {
  idea: Idea;
  colecciones: Coleccion[];
  /** chips legibles tappable para ajustar: abre el sheet de colecciones */
  onAjustar: () => void;
  onQuitarMedia: () => void;
  onSubirMedia: (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <section className="space-y-2 text-[13px] text-text-soft">
      <p>
        <span aria-hidden="true">{ETIQUETAS_TIPO[props.idea.kind]}</span>
        <span aria-hidden="true"> · </span>
        {new Date(props.idea.createdAt).toLocaleDateString('es', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })}
      </p>
      <p>
        Capturada de la Bandeja · <span aria-hidden="true">{relativeTime(props.idea.createdAt)}</span>
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {(props.idea.colecciones ?? []).map((id) => {
          const c = props.colecciones.find((co) => co.id === id);
          if (!c) return null;
          return (
            <button
              key={c.id}
              type="button"
              aria-label={`Ajustar la coleccion ${c.nombre}`}
              onClick={props.onAjustar}
              className="flex h-6 items-center gap-1 rounded-blob border border-border px-2 text-[11px] text-text"
            >
              <Dot color={c.color} tamano="h-2.5 w-2.5" />
              {c.nombre}
            </button>
          );
        })}
        {(props.idea.colecciones ?? []).length === 0 ? (
          <button
            type="button"
            aria-label="Ajustar colecciones"
            onClick={props.onAjustar}
            className="h-6 rounded-blob border border-border px-2 text-[11px] text-text-soft"
          >
            Sin colecciones
          </button>
        ) : null}
      </div>
      {props.idea.mediaUrl ? (
        <button
          type="button"
          onClick={props.onQuitarMedia}
          className="h-9 text-[12px] text-danger"
        >
          Quitar imagen
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="h-9 text-[12px] text-text-soft"
          >
            Anadir imagen
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            aria-label="Subir imagen del item"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) props.onSubirMedia(f);
              e.target.value = '';
            }}
            className="hidden"
          />
        </>
      )}
    </section>
  );
}
