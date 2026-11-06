'use client';

import SugerenciaExterna from './SugerenciaExterna';
import Pensando from './Pensando';
import type { ItemExterno } from '@/lib/types';

export type EstadoExterna = 'quieto' | 'loading' | 'sheet' | 'error' | 'vacio';

/** boton "Buscar conexiones externas" con sus estados (loading, error/vacio)
 * y el sheet de aprobacion cuando hay una activa (spec modulo 10 UI 2-3). */
export default function ExternaBoton(props: {
  estado: EstadoExterna;
  mensaje: string;
  items: ItemExterno[];
  ocupado: boolean;
  onBuscar: () => void;
  onAceptar: (seleccionadas: ItemExterno[]) => void;
  onDescartar: () => void;
  onCerrar: () => void;
}) {
  const { estado } = props;
  return (
    <>
      <section aria-label="Conexiones externas">
        <button
          type="button"
          aria-label="Buscar conexiones externas para esta idea"
          onClick={props.onBuscar}
          disabled={estado === 'loading'}
          className="h-11 w-full rounded-card border border-border text-[14px] font-semibold text-text disabled:opacity-40"
        >
          <span aria-hidden="true" className="text-accent">✦ </span>
          Buscar conexiones externas
        </button>
        {estado === 'loading' ? (
          <div className="mt-2">
            <Pensando texto="Buscando en catalogos y con tu AI..." />
          </div>
        ) : null}
        {estado === 'error' ? (
          <p role="alert" className="mt-2 text-[13px] text-text-soft">
            {props.mensaje}
          </p>
        ) : null}
        {estado === 'vacio' ? (
          <p className="mt-2 text-[13px] text-text-soft">{props.mensaje}</p>
        ) : null}
      </section>
      {estado === 'sheet' && props.items.length > 0 ? (
        <SugerenciaExterna
          items={props.items}
          ocupado={props.ocupado}
          onAceptar={props.onAceptar}
          onDescartar={props.onDescartar}
          onCerrar={props.onCerrar}
        />
      ) : null}
    </>
  );
}
