'use client';

/** interruptor on/off accesible (modulo 19): input checkbox con trilha
 * estilizada; sin iconos externos ni dependencias nuevas. */
export default function Interruptor(props: {
  etiqueta: string;
  activo: boolean;
  onChange: (activo: boolean) => void;
  deshabilitado?: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-2">
      <span className="text-[13px] text-text">{props.etiqueta}</span>
      <span className="relative inline-flex h-6 w-10 shrink-0 items-center">
        <span
          aria-hidden="true"
          className={`absolute inset-0 rounded-full transition-colors ${
            props.activo ? 'bg-accent' : 'bg-[var(--border-control)]'
          }`}
        />
        <span
          aria-hidden="true"
          className={`absolute h-5 w-5 rounded-full bg-white shadow transition-transform ${
            props.activo ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
        <input
          type="checkbox"
          role="switch"
          checked={props.activo}
          disabled={props.deshabilitado}
          aria-label={props.etiqueta}
          onChange={(e) => props.onChange(e.target.checked)}
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none"
        />
      </span>
    </label>
  );
}
