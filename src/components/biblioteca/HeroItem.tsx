'use client';

import { useEffect, useState } from 'react';
import type { Idea } from '@/lib/types';
import { ETIQUETAS_TIPO, parseNota, videoEmbedDe } from '@/lib/biblioteca';
import { createClient } from '@/utils/supabase/browser';

/** hero: arte con imagen cover, video link embebido, link URL, o bloque frontal */
export function HeroItem(props: { idea: Idea }) {
  const { idea } = props;
  const embed = idea.kind === 'link' ? videoEmbedDe(idea.sourceUrl) : null;
  if (embed) {
    return (
      <iframe
        src={embed}
        title="Video del link"
        className="aspect-video w-full rounded-card"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        loading="lazy"
      />
    );
  }
  if (idea.mediaUrl) return <ImagenBucket ruta={idea.mediaUrl} />;
  if (idea.kind === 'link') {
    return (
      <div className="rounded-card bg-accent-soft px-4 py-3">
        <p className="text-[12px] text-text-soft" aria-hidden="true">
          {ETIQUETAS_TIPO[idea.kind]}
        </p>
        <a
          href={idea.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="break-words text-[14px] font-semibold underline decoration-border underline-offset-2"
        >
          {idea.sourceUrl}
        </a>
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      className="flex aspect-[3/1] w-full items-center justify-center rounded-card text-2xl text-accent"
      style={{ backgroundColor: 'var(--accent-soft)' }}
    >
      {idea.kind === 'voz' ? '▶' : '☰'}
    </div>
  );
}

/** imagen del bucket privado via signed URL on demand */
function ImagenBucket(props: { ruta: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let vivo = true;
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

  if (url === null) {
    return (
      <div
        aria-hidden="true"
        className="anim-shimmer h-40 w-full rounded-card bg-gradient-to-r from-border via-surface to-border"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="Imagen del item" className="max-h-[40dvh] w-full rounded-card object-cover" />
  );
}

/**
 * Render de la nota guardada: parrafos, **negrita** y viñetas (limites §1).
 * Todo es React escapado, nunca HTML en crudo (audit §5).
 */
export function VisualNota(props: { nota: string | null | undefined }) {
  const filas = parseNota(props.nota);
  if (filas.length === 0) return null;
  return (
    <div className="space-y-1 text-[14px] leading-relaxed text-text">
      {filas.map((fila, i) => (
        <FilaNota key={i} fila={fila} />
      ))}
    </div>
  );
}

function FilaNota(props: { fila: ReturnType<typeof parseNota>[number] }) {
  const contenido = props.fila.segmentos.map((s, i) =>
    s.negrita ? (
      <strong key={i} className="font-semibold">
        {s.texto}
      </strong>
    ) : (
      <span key={i}>{s.texto}</span>
    )
  );
  if (props.fila.tipo === 'vineta') {
    return (
      <div className="flex gap-2">
        <span aria-hidden="true" className="text-text-soft">
          •
        </span>
        <span className="text-text-soft">{contenido}</span>
      </div>
    );
  }
  return <p>{contenido}</p>;
}
