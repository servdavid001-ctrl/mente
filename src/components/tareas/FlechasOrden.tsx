'use client';

/* paso 4: flechas de reordenar (arriba/abajo), sin drag. Deshabilitadas en
 * los extremos del grupo (puedeSubir/puedeBajar) y mientras reordena. */
export default function FlechasOrden(props: {
  etiqueta: string;
  puedeSubir: boolean;
  puedeBajar: boolean;
  ocupado?: boolean;
  subir: () => void;
  bajar: () => void;
}) {
  return (
    <div className="flex shrink-0 flex-col gap-0.5" aria-label={`Reordenar ${props.etiqueta}`}>
      <button
        type="button"
        aria-label={`Subir ${props.etiqueta}`}
        disabled={!props.puedeSubir || props.ocupado}
        onClick={props.subir}
        className="h-6 w-6 rounded-blob border border-border text-[10px] leading-none text-text-soft disabled:opacity-40"
      >
        ↑
      </button>
      <button
        type="button"
        aria-label={`Bajar ${props.etiqueta}`}
        disabled={!props.puedeBajar || props.ocupado}
        onClick={props.bajar}
        className="h-6 w-6 rounded-blob border border-border text-[10px] leading-none text-text-soft disabled:opacity-40"
      >
        ↓
      </button>
    </div>
  );
}
