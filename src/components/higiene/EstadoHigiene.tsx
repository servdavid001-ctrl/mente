'use client';

/* modulo 9: estados del panel de higiene (carga, error, sin sugerencias). */

type Props = {
  cargando: boolean;
  error: string | null;
  onReintentar: () => void;
};

export default function EstadoHigiene({ cargando, error, onReintentar }: Props) {
  if (cargando) {
    return <p role="status" className="rounded-card px-1 py-3 text-[13px] text-text-soft">Revisando...</p>;
  }
  if (error) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-card bg-danger px-4 py-2.5 text-[13px] text-white">
        <p className="flex-1">{error}</p>
        <button
          type="button"
          onClick={onReintentar}
          className="min-h-11 rounded-blob px-3 text-[13px] underline underline-offset-2"
        >
          Reintentar
        </button>
      </div>
    );
  }
  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-card bg-accent-soft px-4 py-3 text-[13px] text-text"
    >
      <span aria-hidden="true" className="mt-0.5 text-accent">
        ◎
      </span>
      <p className="leading-snug">Todo limpio. Nada que revisar por ahora.</p>
    </div>
  );
}
