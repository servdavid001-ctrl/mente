/* Service worker minimo del modulo 6 (share-target movil).
 * Sin cache agresiva: solo activa el SW para que el manifest pueda recibir
 * shares. Todo fetch sigue yendo a la red (passthrough). */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // passthrough intencional: no interceptamos ni cacheamos respuestas
});
