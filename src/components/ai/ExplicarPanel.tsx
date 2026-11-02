'use client';

import { useEffect, useRef, useState } from 'react';
import Pensando from './Pensando';

export type Turno = { de: 'ai' | 'yo'; texto: string };

/** sheet chat minimo sobre la idea (spec 15): hilo persiste al cerrar
 * (el estado vive en el parent), 3 paragrafos iniciales + seguimiento. */
export default function ExplicarPanel(props: {
  item: { titulo: string };
  hilo: Turno[];
  estado: 'cerrado' | 'pensando' | 'listo' | 'error' | 'rate';
  onPreguntar: (texto: string) => void;
  onReintentar: () => void;
  onCerrar: () => void;
}) {
  const [texto, setTexto] = useState('');
  const [verAnteriores, setVerAnteriores] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const finalRef = useRef<HTMLDivElement>(null);
  const pensando = props.estado === 'pensando';

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    finalRef.current?.scrollIntoView({ block: 'end' });
  }, [props.hilo.length, props.estado]);

  function enviar() {
    const limpio = texto.trim();
    if (!limpio || pensando) return;
    props.onPreguntar(limpio);
    setTexto('');
  }

  function alTeclear(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter envia en desktop (sin shift); en movil envia con el boton
    if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) {
      e.preventDefault();
      enviar();
    }
  }

  const ultimos = props.hilo.length > 5 ? props.hilo.slice(-5) : props.hilo;
  const ocultos = props.hilo.length - ultimos.length;

  return (
    <div
      className="fixed inset-0 z-50"
      onMouseDown={(e) => e.target === e.currentTarget && props.onCerrar()}
    >
      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Explicar esta idea con la AI"
        onKeyDown={(e) => e.key === 'Escape' && props.onCerrar()}
        className="absolute bottom-0 left-1/2 max-h-[85dvh] w-full max-w-md -translate-x-1/2 overflow-y-auto rounded-t-blob bg-raised px-4 pb-4 pt-3 shadow-pop"
      >
        <div className="flex items-center justify-between">
          <p className="font-display text-lg font-semibold">
            <span aria-hidden="true" className="text-accent">✦ </span>
            Sobre esta idea
          </p>
          <button
            type="button"
            aria-label="Cerrar la explicacion"
            onClick={props.onCerrar}
            className="flex h-11 w-11 items-center justify-center rounded-card text-text-soft"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        <p aria-hidden="true" className="truncate text-[11px] text-text-soft">
          {props.item.titulo}
        </p>

        {ocultos > 0 && !verAnteriores ? (
          <button
            type="button"
            onClick={() => setVerAnteriores(true)}
            className="min-h-11 text-[12px] text-text-soft"
          >
            Ver anteriores ({ocultos})
          </button>
        ) : null}
        <div className="space-y-2 py-2" role="log" aria-live="polite" aria-label="Conversacion con la AI">
          {(verAnteriores ? props.hilo : ultimos).map((t, i) => (
            <p
              key={i}
              className={
                t.de === 'yo'
                  ? 'ml-6 rounded-card border border-border bg-surface px-3 py-2 text-[13px] text-text'
                  : 'whitespace-pre-wrap text-[14px] text-text'
              }
            >
              {t.texto}
            </p>
          ))}
          {pensando ? <Pensando /> : null}
          {props.estado === 'error' ? (
            <p className="rounded-card bg-danger/10 px-3 py-2 text-[13px] text-text">
              Tu AI no respondio.
              <button type="button" onClick={props.onReintentar} className="ml-2 min-h-11 text-[13px] font-medium text-accent">
                Reintentar
              </button>
            </p>
          ) : null}
          {props.estado === 'rate' ? (
            <p className="rounded-card bg-danger/10 px-3 py-2 text-[13px] text-text">
              Has usado tu analisis de hoy. Vuelve manana — tus ideas siguen intactas.
            </p>
          ) : null}
          <div ref={finalRef} />
        </div>

        <div className="mt-2 flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={texto}
            rows={1}
            aria-label="Pregunta algo sobre esta idea"
            placeholder="Pregunte algo sobre esta idea..."
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={alTeclear}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-card border border-border bg-surface px-3 py-2 text-[14px] text-text"
          />
          <button
            type="button"
            aria-label="Enviar la pregunta"
            onClick={() => enviar()}
            disabled={pensando || !texto.trim()}
            className="h-11 w-11 shrink-0 rounded-card bg-accent text-white disabled:opacity-40"
          >
            <span aria-hidden="true">↑</span>
          </button>
        </div>
      </div>
    </div>
  );
}
