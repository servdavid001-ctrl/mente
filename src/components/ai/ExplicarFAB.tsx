'use client';

/** boton flotante ✦ del detalle (spec 15): 56px accent, esquina inferior
 * derecha, no tapa el hero; focus ring base del sistema. */
export default function ExplicarFAB(props: { onClick: () => void; ariaLabel: string }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-label={props.ariaLabel}
      className="fixed bottom-28 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-pop"
    >
      <span aria-hidden="true" className="text-xl">✦</span>
    </button>
  );
}
