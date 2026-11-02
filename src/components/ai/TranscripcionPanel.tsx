'use client';

import Pensando from './Pensando';

/** cita de articulo / transcripcion de video-audio en el detalle (spec 14.1).
 * Copy sin drama: rate con accion deshabilitada, error con lienzo suave. */
export default function TranscripcionPanel(props: {
  estado: 'idle' | 'loading' | 'listo' | 'error' | 'rate';
  texto?: string;
  origen: 'articulo' | 'video';
  onAnalizar: () => void;
  onReintentar: () => void;
  onAniadirANota: (texto: string) => void;
}) {
  const etiquetaOrigen =
    props.origen === 'articulo' ? '✦ Sacado del articulo' : '✦ Transcripcion del audio';
  return (
    <div className="rounded-card border border-border bg-surface px-3 py-3">
      <p className="text-[13px] font-semibold text-text">{etiquetaOrigen}</p>
      {props.estado === 'loading' ? <Pensando /> : null}
      {props.estado === 'idle' ? (
        <button
          type="button"
          aria-label="Ampliar este contenido con la AI"
          onClick={props.onAnalizar}
          className="min-h-11 text-[13px] font-medium text-accent"
        >
          Ampliar con la AI ✦
        </button>
      ) : null}
      {props.estado === 'error' ? (
        <>
          <p className="text-[13px] text-text-soft">No se pudo procesar.</p>
          <button
            type="button"
            onClick={props.onReintentar}
            className="min-h-11 text-[13px] font-medium text-accent"
          >
            Reintentar
          </button>
        </>
      ) : null}
      {props.estado === 'rate' ? (
        <p className="text-[13px] text-text-soft">
          Has usado tu analisis de hoy. Vuelve manana — tus ideas siguen intactas.
        </p>
      ) : null}
      {props.estado === 'listo' && props.texto ? (
        <>
          <blockquote className="mt-1 max-h-56 overflow-y-auto whitespace-pre-wrap border-l-2 border-accent pl-2 text-[13px] text-text">
            {props.texto}
          </blockquote>
          <button
            type="button"
            aria-label="Anadir la transcripcion a mi nota"
            onClick={() => props.onAniadirANota(props.texto ?? '')}
            className="min-h-11 text-[13px] font-medium text-text-soft"
          >
            Anadir a mi nota
          </button>
        </>
      ) : null}
    </div>
  );
}
