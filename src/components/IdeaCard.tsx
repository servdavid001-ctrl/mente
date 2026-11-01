'use client';

import { useState } from 'react';
import type { Idea } from '@/lib/types';
import { relativeTime } from '@/lib/time';
import { createClient } from '@/utils/supabase/browser';
import IdeaActionSheet from './IdeaActionSheet';

const ETIQUETAS: Record<Idea['kind'], string> = {
  texto: 'Texto',
  voz: 'Nota de voz',
  link: 'Link',
  arte: 'Arte'
};

export default function IdeaCard(props: {
  idea: Idea;
  nueva?: boolean;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [sheet, setSheet] = useState<'cerrada' | 'abierta' | 'confirmar'>('cerrada');
  const [hint, setHint] = useState(false);

  function cerrar() {
    setSheet('cerrada');
  }

  return (
    <article
      className={`rounded-card bg-surface p-4 shadow-card ${props.nueva ? 'anim-fade-rise' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Linea idea={props.idea} />
        </div>
        <button
          type="button"
          aria-label="Opciones de esta idea"
          onClick={() => setSheet('abierta')}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card text-text-soft"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            ⋯
          </span>
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2 text-[13px] text-text-soft">
        <span aria-hidden="true">{ETIQUETAS[props.idea.kind]}</span>
        <span aria-hidden="true">·</span>
        <span aria-hidden="true">{relativeTime(props.idea.createdAt)}</span>
        <button
          type="button"
          role="img"
          aria-label="Sin categorizar"
          onClick={() => setHint(true)}
          className="flex h-6 items-center rounded-full bg-[color:var(--text-soft)] px-1.5"
        >
          <span aria-hidden="true" className="text-[10px] text-white">
            ✗
          </span>
        </button>
        {hint ? (
          <span aria-live="polite" className="truncate text-[12px]">
            Aun sin categoria — la organizadora llegara pronto
          </span>
        ) : null}
      </div>

      {sheet !== 'cerrada' ? (
        <IdeaActionSheet
          paso={sheet === 'abierta' ? 'pedidos' : 'confirmar'}
          onArchivar={() => {
            cerrar();
            props.onArchive(props.idea.id);
          }}
          onPedirEliminar={() => setSheet('confirmar')}
          onConfirmarEliminar={() => {
            cerrar();
            props.onDelete(props.idea.id);
          }}
          onCancelar={cerrar}
          onClose={cerrar}
        />
      ) : null}
    </article>
  );
}

/** primera linea visual-first: contenido semibold o gesto del tipo */
function Linea(props: { idea: Idea }) {
  if (props.idea.kind === 'link') {
    return (
      <p className="truncate text-base font-semibold">
        <a
          href={props.idea.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-border underline-offset-2"
        >
          {props.idea.sourceUrl}
        </a>
      </p>
    );
  }
  if (props.idea.kind === 'voz') {
    return <NotaVoz idea={props.idea} />;
  }
  return <p className="whitespace-pre-wrap break-words text-base font-semibold">{props.idea.text}</p>;
}

/** reproduce la nota de voz pidiendo una URL firmada on demand (bucket private) */
function NotaVoz(props: { idea: Idea }) {
  const [url, setUrl] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function tocar() {
    if (url || cargando || !props.idea.sourceUrl) return;
    setCargando(true);
    try {
      const { data, error } = await createClient()
        .storage.from('ideas-audio')
        .createSignedUrl(props.idea.sourceUrl, 300);
      if (error || !data.signedUrl) throw error ?? new Error('Error');
      const audio = new Audio(data.signedUrl);
      audio.onended = () => setUrl(null);
      setUrl(data.signedUrl);
      void audio.play();
    } catch {
      setUrl(null);
    } finally {
      setCargando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void tocar()}
      disabled={cargando}
      className="flex items-center gap-2 text-base font-semibold"
      aria-label={cargando ? 'Preparando la nota de voz' : 'Reproducir la nota de voz'}
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white"
      >
        ▶
      </span>
      {cargando ? 'Preparando...' : 'Reproducir'}
    </button>
  );
}
