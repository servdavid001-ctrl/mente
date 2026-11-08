'use client';

import { useRef } from 'react';
import type { ChangeEvent as Cambio } from 'react';

const ACCEPT = 'image/jpeg,image/png,image/webp';

type Props = {
  subiendo: boolean;
  ocupado: boolean;
  onSubir: (file: File | null) => Promise<boolean>;
};

/** modulo 18: 2 botones, MISMO pipeline useFoto (validaciones y POST
 * identicos). Galeria abre el file picker normal; Camara lo dispara con
 * capture="environment" (en desktop cae al mismo picker). */
export default function FotoBotones(props: Props) {
  const inputGaleria = useRef<HTMLInputElement>(null);
  const inputCamara = useRef<HTMLInputElement>(null);
  const abierto = props.subiendo || props.ocupado;

  async function alElegir(e: Cambio<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = '';
    await props.onSubir(file);
  }

  return (
    <>
      <input
        ref={inputGaleria}
        type="file"
        accept={ACCEPT}
        onChange={(e) => void alElegir(e)}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
      <input
        ref={inputCamara}
        type="file"
        accept={ACCEPT}
        capture="environment"
        onChange={(e) => void alElegir(e)}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
      <button
        type="button"
        aria-label={props.subiendo ? 'Subiendo la foto' : 'Subir foto de la galeria'}
        disabled={abierto}
        onClick={() => {
          if (!abierto) void inputGaleria.current?.click();
        }}
        className="flex h-11 w-11 items-center justify-center"
      >
        {props.subiendo ? (
          <Spinner />
        ) : (
          <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft">
            <Galeria />
          </span>
        )}
      </button>
      <button
        type="button"
        aria-label={props.subiendo ? 'Subiendo la foto' : 'Tomar una foto con la camara'}
        disabled={abierto}
        onClick={() => {
          if (!abierto) void inputCamara.current?.click();
        }}
        className="flex h-11 w-11 items-center justify-center"
      >
        {props.subiendo ? (
          <Spinner />
        ) : (
          <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft">
            <Camara />
          </span>
        )}
      </button>
    </>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-accent-soft border-t-accent"
    />
  );
}

function Galeria() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5" stroke="currentColor" strokeWidth="1.75">
      <rect x="3.75" y="4.75" width="16.5" height="14.5" rx="2" />
      <circle cx="9" cy="10" r="1.75" />
      <path d="m5 17.5 4.25-4.25 3 3L16 12.5l2.25 2.25" />
    </svg>
  );
}

function Camara() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5" stroke="currentColor" strokeWidth="1.75">
      <path d="M4 8.75a2 2 0 0 1 2-2h1.6l1.2-1.8a1 1 0 0 1 .83-.45h4.74a1 1 0 0 1 .83.45l1.2 1.8H18a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8.75Z" />
      <circle cx="12" cy="12.25" r="3.25" />
    </svg>
  );
}
