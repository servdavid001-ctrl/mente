'use client';

import { useState } from 'react';
import type { KeyboardEvent as Teclado, ClipboardEvent as Pegado } from 'react';
import { createClient } from '@/utils/supabase/browser';
import { useRecorder, ERROR_MIC } from './capture/useRecorder';
import type { IdeaPayload } from '@/lib/types';

const URL_RE = /^https?:\/\/\S+$/i;

export default function CaptureBar(props: { onSend: (idea: IdeaPayload) => Promise<void> }) {
  const [texto, setTexto] = useState('');
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [subiendoVoz, setSubiendoVoz] = useState(false);
  const mic = useRecorder();

  async function enviar() {
    if (enviando || subiendoVoz) return;
    const t = texto.trim();
    if (mic.grabando) {
      await mandarVoz();
      return;
    }
    if (!t && !linkUrl) return;
    if (URL_RE.test(t) && !linkUrl) {
      // URL tecleada o pegada: va por sourceUrl; text queda solo para notas del usuario
      const payload: IdeaPayload = { text: '', sourceUrl: t, kind: 'link' };
      await mandar(payload);
      return;
    }
    const payload: IdeaPayload = { text: t, sourceUrl: linkUrl ?? undefined, kind: 'texto' };
    await mandar(payload);
  }

  async function mandar(payload: IdeaPayload) {
    setEnviando(true);
    try {
      await props.onSend(payload);
      setTexto('');
      setLinkUrl(null);
    } finally {
      setEnviando(false);
    }
  }

  async function mandarVoz() {
    const blob = await mic.detener();
    if (!blob) return;
    setSubiendoVoz(true);
    try {
      const client = createClient();
      const { data: { user }, error: errUser } = await client.auth.getUser();
      if (errUser || !user) throw new Error('Sesion expirada');
      const ruta = `${user.id}/${crypto.randomUUID()}.webm`;
      const { error: errSubida } = await client.storage
        .from('ideas-audio')
        .upload(ruta, blob, { contentType: blob.type || 'audio/webm' });
      if (errSubida) throw errSubida;
      await props.onSend({ text: '', sourceUrl: ruta, kind: 'voz' });
    } catch {
      mic.setError('No se pudo subir la nota de voz. Reintenta la grabacion.');
    } finally {
      setSubiendoVoz(false);
    }
  }

  async function micTap() {
    if (subiendoVoz || enviando) return;
    if (mic.grabando) {
      await mandarVoz();
      return;
    }
    setLinkUrl(null);
    await mic.iniciar();
  }

  function tomarLink() {
    const t = texto.trim();
    if (!/^https?:\/\//i.test(t)) return;
    setLinkUrl(t);
    setTexto('');
  }

  function alPegar(e: Pegado<HTMLInputElement>) {
    const t = e.clipboardData.getData('text').trim();
    if (!/^https?:\/\//i.test(t)) return;
    e.preventDefault();
    setTexto('');
    setLinkUrl(t);
  }

  function onKeyDown(e: Teclado<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      void enviar();
    }
  }

  const hayTexto = texto.trim().length > 0;
  const puedeEnviar = (hayTexto || linkUrl !== null || mic.grabando) && !enviando && !subiendoVoz;

  return (
    <form
      aria-label="Capturar una idea"
      className="shrink-0"
      onSubmit={(e) => {
        e.preventDefault();
        void enviar();
      }}
    >
      <div className="md:flex md:items-center md:gap-2">
        <div className="min-w-0 md:flex-1">
          {mic.grabando ? (
            <div aria-live="polite" className="flex h-11 items-center gap-2 rounded-card bg-accent-soft px-3">
              <span aria-hidden="true" className="flex items-end gap-0.5">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="anim-wave h-4 w-0.5 rounded-full bg-accent"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </span>
              <span aria-hidden="true" className="text-sm font-medium">
                Escuchando...
              </span>
            </div>
          ) : linkUrl ? (
            <div className="flex h-11 items-center gap-2 rounded-card border border-border bg-raised px-3">
              <img
                src={`https://www.google.com/s2/favicons?sz=32&domain=${dominio(linkUrl)}`}
                alt=""
                aria-hidden="true"
                width={16}
                height={16}
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] text-text-soft">Link pegado</span>
                <span aria-hidden="true" className="block truncate text-sm font-medium">
                  {dominio(linkUrl)}
                </span>
              </span>
              <button
                type="button"
                aria-label="Quitar el link"
                onClick={() => setLinkUrl(null)}
                className="flex h-11 w-11 items-center justify-center text-text-soft"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
          ) : (
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onPaste={alPegar}
              onKeyDown={onKeyDown}
              maxLength={20000}
              placeholder="Escribe tu idea..."
              aria-label="Escribe tu idea"
              className="h-11 w-full rounded-card border border-border bg-raised px-3 text-[15px] text-text placeholder:text-text-soft"
            />
          )}
        </div>

        <div className="mt-1 flex items-center gap-1 md:mt-0 md:shrink-0">
          {hayTexto || linkUrl ? null : (
            <>
              <MicBoton grabando={mic.grabando} ocupado={enviando} onTap={micTap} />
              <LinkBoton texto={texto} onTap={tomarLink} />
            </>
          )}
          <SendBoton
            activo={puedeEnviar}
            ocupado={enviando || subiendoVoz}
            grabando={mic.grabando}
            onTap={() => void enviar()}
          />
        </div>
      </div>

      {mic.error ? (
        <p role="alert" className="mt-1 px-1 text-xs text-danger">
          {mic.error === ERROR_MIC ? ERROR_MIC : mic.error}
        </p>
      ) : null}
    </form>
  );
}

function MicBoton(props: { grabando: boolean; ocupado: boolean; onTap: () => void }) {
  return (
    <button
      type="button"
      aria-label={props.grabando ? 'Parar la grabacion y enviar' : 'Grabar una nota de voz'}
      disabled={props.ocupado}
      onClick={props.onTap}
      className="flex h-11 w-11 items-center justify-center"
    >
      {props.grabando ? (
        <span aria-hidden="true" className="h-6 w-6 rounded-full bg-danger" />
      ) : (
        <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft">
          <Mic />
        </span>
      )}
    </button>
  );
}

/** activo solo si el texto actual SI empieza con http(s):// (spec CaptureBar) */
function LinkBoton(props: { texto: string; onTap: () => void }) {
  const activo = /^https?:\/\//i.test(props.texto.trim());
  return (
    <button
      type="button"
      aria-label="Boton para pegar un link"
      onClick={props.onTap}
      className={`flex h-11 w-11 items-center justify-center ${activo ? 'text-accent' : 'text-text-soft'}`}
    >
      <span aria-hidden="true" className="text-lg leading-none">
        🔗
      </span>
    </button>
  );
}

function SendBoton(props: { activo: boolean; ocupado: boolean; grabando: boolean; onTap: () => void }) {
  return (
    <button
      type="button"
      aria-label="Guardar idea"
      aria-disabled={!props.activo}
      onClick={props.onTap}
      className={`ml-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white transition-transform active:scale-[0.92] ${
        props.activo ? 'opacity-100' : 'opacity-40'
      }`}
    >
      {props.ocupado ? (
        <span
          aria-hidden="true"
          className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
        />
      ) : props.grabando ? (
        <span aria-hidden="true" className="h-4 w-4 rounded-full bg-white" />
      ) : (
        <span aria-hidden="true" className="text-lg leading-none">
          ↗
        </span>
      )}
    </button>
  );
}

export function Mic() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5" stroke="currentColor" strokeWidth="1.75">
      <rect x="9" y="3.75" width="6" height="10.5" rx="3" />
      <path d="M5.75 11.5a6.25 6.25 0 0 0 12.5 0" />
      <path d="M12 17.75v2.5" />
    </svg>
  );
}

function dominio(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
