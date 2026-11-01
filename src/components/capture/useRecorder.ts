'use client';

import { useRef, useState } from 'react';

export const ERROR_MIC = 'No pudimos usar el microfono. Revisa los permisos del navegador.';

type Grabadora = {
  recorder: MediaRecorder;
  stream: MediaStream;
  chunks: Blob[];
};

/** graba audio y entrega el Blob al detener; los errores de permiso son descriptivos */
export function useRecorder() {
  const [grabando, setGrabando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<Grabadora | null>(null);
  const resolver = useRef<((blob: Blob | null) => void) | null>(null);

  async function iniciar(): Promise<boolean> {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let miRecorder: MediaRecorder;
      try {
        miRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      } catch {
        miRecorder = new MediaRecorder(stream); // Safari: sin webm, formato nativo
      }
      const chunks: Blob[] = [];
      miRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      miRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setGrabando(false);
        const blob = new Blob(chunks, { type: miRecorder.mimeType || 'audio/webm' });
        resolver.current?.(blob.size > 0 ? blob : null);
      };
      ref.current = { recorder: miRecorder, stream, chunks };
      miRecorder.start();
      setGrabando(true);
      return true;
    } catch {
      setError(ERROR_MIC);
      return false;
    }
  }

  function detener(): Promise<Blob | null> {
    if (!ref.current || resolver.current) return Promise.resolve(null);
    return new Promise((resolve) => {
      resolver.current = resolve;
      ref.current?.recorder.stop();
      ref.current = null;
    });
  }

  return { grabando, error, setError, iniciar, detener };
}
