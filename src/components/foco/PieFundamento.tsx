'use client';

/** pie de la sheet fundamento (modulo 16 B): Crear/Descartar del draft,
 * confirmacion de creado y Cerrar segun la fase. Descartar no toca nada. */
export default function PieFundamento(props: {
  fase: 'cargando' | 'propuesta' | 'existe' | 'error';
  creada: boolean;
  creando: boolean;
  onCrear: () => void;
  onCerrar: () => void;
}) {
  return (
    <div className="mt-3 space-y-2">
      {props.fase === 'propuesta' && !props.creada ? (
        <BotonesCrear creando={props.creando} onCrear={props.onCrear} onDescartar={props.onCerrar} />
      ) : null}
      {props.creada ? <Creado onCerrar={props.onCerrar} /> : null}
      {!props.creada && props.fase !== 'propuesta' ? (
        <BotonCerrar onCerrar={props.onCerrar} cargando={props.fase === 'cargando'} />
      ) : null}
    </div>
  );
}

function BotonesCrear(props: {
  creando: boolean;
  onCrear: () => void;
  onDescartar: () => void;
}) {
  return (
    <>
      <button
        type="button"
        aria-label="Crear la pagina de fundamento"
        disabled={props.creando}
        onClick={props.onCrear}
        className="h-11 w-full rounded-card bg-accent text-[14px] font-semibold text-white disabled:opacity-40"
      >
        {props.creando ? 'Creando...' : 'Crear fundamento'}
      </button>
      <button
        type="button"
        aria-label="Descartar el draft del fundamento"
        disabled={props.creando}
        onClick={props.onDescartar}
        className="h-11 w-full rounded-card border border-border text-[14px] font-semibold text-text disabled:opacity-40"
      >
        Descartar
      </button>
    </>
  );
}

function Creado(props: { onCerrar: () => void }) {
  return (
    <>
      <p role="status" className="text-[13px] text-text-soft">
        Fundamento creado. Ya esta en las notas del proyecto.
      </p>
      <BotonCerrar onCerrar={props.onCerrar} cargando={false} />
    </>
  );
}

function BotonCerrar(props: { onCerrar: () => void; cargando: boolean }) {
  return (
    <button
      type="button"
      aria-label="Cerrar la sheet de fundamento"
      disabled={props.cargando}
      onClick={props.onCerrar}
      className="h-11 w-full rounded-card border border-border text-[14px] font-semibold text-text disabled:opacity-40"
    >
      Cerrar
    </button>
  );
}
