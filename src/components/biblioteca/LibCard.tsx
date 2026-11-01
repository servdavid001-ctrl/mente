'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Coleccion, Idea } from '@/lib/types';
import { relativeTime } from '@/lib/time';
import { ETIQUETAS_TIPO } from '@/lib/biblioteca';
import { createClient } from '@/utils/supabase/browser';
import { Dot } from './ColeccionChip';

/** LibCard visual-first del grid (spec §2): media o bloque frontal + meta */
export default function LibCard(props: {
  idea: Idea;
  colecciones: Coleccion[];
  /** modo archivadas: opacity + chip Archivada (spec §6) */
  archivoVisible?: boolean;
}) {
  const esVoz = props.idea.kind === 'voz';
  const conImagen = props.idea.mediaUrl !== null && props.idea.mediaUrl !== undefined;

  const titulo = tituloDe(props.idea);
  const mis = new Map(props.colecciones.map((c) => [c.id, c]));
  const chips: Coleccion[] = [];
  for (const id of props.idea.colecciones ?? []) {
    const c = mis.get(id);
    if (c) chips.push(c);
  }

  return (
    <Link
      href={`/biblioteca/${props.idea.id}`}
      className={`block overflow-hidden rounded-card bg-surface shadow-card ${
        props.archivoVisible ? 'opacity-55' : ''
      }`}
      aria-label={titulo}
    >
      {esVoz ? <Frontal icono="▶" /> : conImagen ? <Cubierta ruta={props.idea.mediaUrl ?? ''} /> : <Frontal icono="☰" />}

      <div className="space-y-1 p-3">
        <p className="truncate text-[14px] font-semibold text-text">{titulo}</p>
        <p aria-hidden="true" className="text-[12px] text-text-soft">
          {ETIQUETAS_TIPO[props.idea.kind]} · {relativeTime(props.idea.createdAt)}
        </p>
        {props.archivoVisible ? (
          <span
            aria-hidden="true"
            className="inline-flex h-6 items-center rounded-blob border border-border px-2 text-[11px] text-text-soft"
          >
            Archivada
          </span>
        ) : null}
        {chips.length > 0 ? (
          <div aria-hidden="true" className="flex items-center gap-1.5 pt-0.5">
            {chips.slice(0, 2).map((c) => (
              <span key={c.id} className="flex items-center gap-1 text-[11px] text-text-soft">
                <Dot color={c.color} tamano="h-2.5 w-2.5" />
                {c.nombre}
              </span>
            ))}
            {chips.length > 2 ? (
              <span className="text-[11px] text-text-soft">+{chips.length - 2}</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

/** imagen cubre la mitad superior, ratio 1:1, radius superior 16 (spec §2) */
function Cubierta(props: { ruta: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let vivo = true;
    if (!props.ruta) return;
    createClient()
      .storage.from('biblioteca-media')
      .createSignedUrl(props.ruta, 300)
      .then(({ data }) => {
        if (vivo && data?.signedUrl) setUrl(data.signedUrl);
      });
    return () => {
      vivo = false;
    };
  }, [props.ruta]);

  if (!url) return <div className="anim-shimmer aspect-square w-full rounded-t-card bg-gradient-to-r from-border via-surface to-border" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="aspect-square w-full rounded-t-card object-cover" />
  );
}

/** bloque frontal con icono del tipo sobre accent-soft (texto/voz sin media) */
function Frontal(props: { icono: string }) {
  return (
    <div
      aria-hidden="true"
      className="flex aspect-square w-full items-center justify-center rounded-t-card text-3xl text-accent"
      style={{ backgroundColor: 'var(--accent-soft)' }}
    >
      {props.icono}
    </div>
  );
}

function tituloDe(idea: Idea): string {
  const primera = (idea.text || '').split('\n')[0].trim();
  if (primera) return primera;
  if (idea.kind === 'link') return idea.sourceUrl ?? 'Link';
  if (idea.kind === 'voz') return 'Nota de voz';
  return 'Arte';
}
