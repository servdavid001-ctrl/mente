'use client';

/** indicator "Pensando..." (spec 11): 3 puntos secuenciales 400ms con
 * aria-live polite; con reduced-motion queda texto estatico (regla dura). */
export default function Pensando(props: { texto?: string }) {
  return (
    <p aria-live="polite" className="flex items-center gap-1.5 text-[13px] text-text-soft">
      <span aria-hidden="true" className="anim-dot-seq inline-flex gap-0.5 text-sm font-semibold">
        <span>.</span>
        <span>.</span>
        <span>.</span>
      </span>
      <span>{props.texto ?? 'Pensando...'}</span>
    </p>
  );
}
