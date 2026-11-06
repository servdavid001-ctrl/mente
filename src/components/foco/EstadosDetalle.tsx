'use client';

import { useRouter } from 'next/navigation';

/** estados secundarios del detalle: esqueleto inicial y "proyecto inexistente"
 * (modulo 11; sin proyecto no hay error de red, es 404 sensible). */
export function EsqueletoDetalle() {
  return (
    <div className="space-y-3 pt-2" aria-hidden="true">
      <div className="anim-shimmer h-24 w-full rounded-card bg-border" />
      <div className="anim-shimmer h-12 w-full rounded-card bg-border" />
      <div className="anim-shimmer h-32 w-full rounded-card bg-border" />
    </div>
  );
}

export function SinProyecto() {
  const router = useRouter();
  return (
    <div className="space-y-3 pt-10 text-center">
      <p className="font-display text-xl font-semibold">Ese proyecto no existe.</p>
      <button
        type="button"
        onClick={() => router.push('/foco')}
        className="h-11 w-full rounded-card border border-border text-[14px] font-semibold text-text"
      >
        Volver a Foco
      </button>
    </div>
  );
}
