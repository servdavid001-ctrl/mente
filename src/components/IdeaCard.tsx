'use client';

import { useState } from 'react';
import type { ChipSugerenciaUI, Coleccion, Idea } from '@/lib/types';
import { relativeTime } from '@/lib/time';
import { createClient } from '@/utils/supabase/browser';
import { Dot } from './biblioteca/ColeccionChip';
import MiniaturaArte from './MiniaturaArte';
import IdeaActionSheet from './IdeaActionSheet';
import ChipSugerencia, { BotonNoMeSirve } from './ai/ChipSugerencia';
import BotonPedirSugerencia from './ai/BotonPedirSugerencia';
import type { EstadoPedido } from './ai/cliente';

const ETIQUETAS: Record<Idea['kind'], string> = {
  texto: 'Texto',
  voz: 'Nota de voz',
  link: 'Link',
  arte: 'Arte'
};

export default function IdeaCard(props: {
  idea: Idea;
  nueva?: boolean;
  /** mini-chips de colecciones de la spec §3 resultado */
  colecciones?: Coleccion[];
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  /** el badge ✗/✓ es tappeable y abre el CategorizarSheet (spec §3) */
  onCategorizar?: (id: string) => void;
  /** bandera del toggle archivadas en Bandeja (solo visual, vacio de frio) */
  verArchivadaChip?: boolean;
  /** AI modulo 3: chip de sugerencia pendiente + pedir sugerencia manual */
  chipAI?: ChipSugerenciaUI;
  pedirEstado?: EstadoPedido;
  onAbrirChipSugerencia?: (ideaId: string) => void;
  onDescartarSugerencia?: (sugerenciaId: string) => void;
  onPedirSugerencia?: (ideaId: string) => void;
}) {
  const [sheet, setSheet] = useState<'cerrada' | 'abierta' | 'confirmar'>('cerrada');

  function cerrar() {
    setSheet('cerrada');
  }

  const nombres = new Map((props.colecciones ?? []).map((c) => [c.id, c]));
  const chips: Coleccion[] = [];
  for (const id of props.idea.colecciones ?? []) {
    const c = nombres.get(id);
    if (c) chips.push(c);
    if (chips.length >= 2) break;
  }
  const sobra = (props.idea.colecciones ?? []).length - chips.length;

  return (
    <article
      className={`hover-card rounded-card bg-surface p-4 shadow-card md:p-5 ${props.nueva ? 'anim-fade-rise' : ''} ${
        props.idea.archivada ? 'opacity-55' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <Linea idea={props.idea} />
        </div>
        {props.idea.kind === 'arte' && props.idea.mediaUrl ? (
          <MiniaturaArte ruta={props.idea.mediaUrl} />
        ) : null}
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
        {props.chipAI && !props.idea.categorized ? (
          <ChipSugerencia
            sugerencia={{
              coleccionId: props.chipAI.coleccionId ?? props.chipAI.sugerenciaId,
              nombreColeccion: props.chipAI.nombreColeccion,
              esNueva: Boolean(props.chipAI.esNueva),
              dotColor: props.chipAI.dotColor
            }}
            ideaId={props.idea.id}
            onOpenSheet={(id) => props.onAbrirChipSugerencia?.(id)}
          />
        ) : (
          <button
            type="button"
            role="img"
            aria-label={props.idea.categorized ? 'Categorizada en Biblioteca' : 'Sin categorizar'}
            onClick={() => props.onCategorizar?.(props.idea.id)}
            className={`flex h-6 items-center rounded-full px-1.5 ${
              props.idea.categorized ? 'bg-success' : 'bg-[color:var(--text-soft)]'
            }`}
          >
            <span aria-hidden="true" className="text-[10px] text-white anim-fade-rise">
              {props.idea.categorized ? '✓' : '✗'}
            </span>
          </button>
        )}
      </div>

      {props.chipAI && !props.idea.categorized ? (
        <BotonNoMeSirve onDescartar={() => props.onDescartarSugerencia?.(props.chipAI!.sugerenciaId)} />
      ) : !props.idea.categorized && props.onPedirSugerencia ? (
        <BotonPedirSugerencia
          ideaId={props.idea.id}
          estado={props.pedirEstado ?? 'quieto'}
          onPedir={props.onPedirSugerencia}
        />
      ) : null}

      {chips.length > 0 ? (
        <div aria-hidden="true" className="anim-fade-rise mt-2 flex flex-wrap items-center gap-1.5">
          {chips.map((c) => (
            <span
              key={c.id}
              className="flex h-6 items-center gap-1 rounded-blob border border-border px-2 text-[11px] text-text-soft"
            >
              <Dot color={c.color} tamano="h-2.5 w-2.5" />
              {c.nombre}
            </span>
          ))}
          {sobra > 0 ? <span className="text-[11px] text-text-soft">+{sobra}</span> : null}
        </div>
      ) : null}

      {props.verArchivadaChip && props.idea.archivada ? (
        <span
          className="mt-2 inline-flex h-6 items-center rounded-blob border border-border px-2 text-[11px] text-text-soft"
        >
          Archivada
        </span>
      ) : null}

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
          onCategorizar={props.onCategorizar
            ? () => {
                cerrar();
                props.onCategorizar?.(props.idea.id);
              }
            : undefined}
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
