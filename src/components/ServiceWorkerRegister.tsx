'use client';

import { useEffect } from 'react';

/** registra el service worker minimo que habilita el share-target del PWA */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const registrar = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch {
        // el PWA sigue funcionando sin SW; el share-target queda inactivo
      }
    };

    void registrar();
  }, []);

  return null;
}
