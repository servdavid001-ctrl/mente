'use client';

/* modulo 9: fila de una recomendacion de higiene. Informa y pregunta; todo
 * boton es una accion explicita del usuario sobre datos existentes. */

import type { Recomendacion } from '@/lib/higiene';

type Props = {
  rec: Recomendacion;
  ocupado: boolean;
  onArchivar: (rec: Recomendacion) => void;
  onMarcarHecha: (rec: Recomendacion) => void;
  onEliminar: (rec: Recomendacion) => void;
};

const CLASE_BOTON =
  'min-h-11 shrink-0 rounded-blob px-3 text-[13px] disabled:opacity-50';
const CLASE_TEXTO = `${CLASE_BOTON} text-text-soft hover:text-text disabled:hover:text-text-soft`;

export default function HigieneFila(props: Props) {
  const { rec } = props;
  return (
    <li className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] text-text">{rec.titulo}</p>
        <p className="mt-0.5 text-[12px] text-text-soft">{rec.detalle}</p>
      </div>
      <div className="flex shrink-0 items-center">
        {rec.tipo === 'idea_bandeja' || rec.tipo === 'idea_biblioteca_apartada' ? (
          <button
            type="button"
            disabled={props.ocupado}
            onClick={() => props.onArchivar(rec)}
            className={CLASE_TEXTO}
          >
            Archivar
          </button>
        ) : null}
        {rec.tipo === 'tarea_vieja' ? (
          <button
            type="button"
            disabled={props.ocupado}
            onClick={() => props.onMarcarHecha(rec)}
            className={CLASE_TEXTO}
          >
            Marcar hecha
          </button>
        ) : null}
        <button
          type="button"
          disabled={props.ocupado}
          onClick={() => props.onEliminar(rec)}
          className={`${CLASE_TEXTO} text-danger hover:text-danger`}
        >
          Eliminar
        </button>
      </div>
    </li>
  );
}
