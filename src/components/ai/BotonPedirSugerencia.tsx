'use client';

/** Bandeja: pedir sugerencia manual para un item sin propuesta (spec 14) */
export default function BotonPedirSugerencia(props: {
  ideaId: string;
  onPedir: (ideaId: string) => void;
  estado: 'quieto' | 'loading' | 'error' | 'rate' | 'indisponible';
}) {
  const texto =
    props.estado === 'loading'
      ? 'Pensando...'
      : props.estado === 'error'
        ? 'No se pudo procesar. Reintentar'
        : props.estado === 'rate'
          ? 'Has usado tu analisis de hoy. Vuelve manana'
          : props.estado === 'indisponible'
            ? 'La AI no esta disponible todavia. Reintentar'
            : 'Pedir sugerencia ✦';
  return (
    <button
      type="button"
      aria-label={
        props.estado === 'rate'
          ? 'Analisis de hoy agotado, vuelve manana'
          : props.estado === 'indisponible'
            ? 'La AI no esta disponible todavia'
            : `Pedir sugerencia de la AI para esta idea ${props.ideaId}`
      }
      onClick={() =>
        (props.estado === 'quieto' ||
          props.estado === 'error' ||
          props.estado === 'indisponible') &&
        props.onPedir(props.ideaId)
      }
      disabled={props.estado === 'loading' || props.estado === 'rate'}
      className="min-h-11 text-[13px] font-medium text-text-soft"
    >
      {props.estado === 'loading' ? (
        <span aria-hidden="true" className="mr-1 text-accent">✦</span>
      ) : null}
      {texto}
    </button>
  );
}
