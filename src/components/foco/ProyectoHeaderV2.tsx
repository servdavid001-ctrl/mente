'use client';

import { useState } from 'react';
import MenuProyecto from './MenuProyecto';
import ProgresoTarjeta from './ProgresoTarjeta';
import FundamentoSheet from './FundamentoSheet';
import type { Proyecto } from '@/lib/types';

/** cabecera del proyecto (modulo 11/16): nombre + progreso de tareas +
 * acciones (boton Fundamento del modulo 16 y menu de tres puntos con
 * "Plegar proyecto"). Reemplaza el toggler fijo de la v1. */
export default function ProyectoHeaderV2(props: {
  proyecto: Proyecto;
  plegando: boolean;
  onPlegar: () => void;
}) {
  const { proyecto } = props;
  const [fundamentoAbierto, setFundamentoAbierto] = useState(false);

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 rounded-full"
            style={{ backgroundColor: proyecto.color }}
          />
          <h1 className="truncate font-display text-[24px] font-semibold md:text-[28px]">
            {proyecto.nombre}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label={`Ver el fundamento de ${proyecto.nombre}`}
            onClick={() => setFundamentoAbierto(true)}
            className="h-10 rounded-card border border-border px-3 text-[13px] font-semibold text-text"
          >
            Fundamento
          </button>
          <MenuProyecto
            nombreProyecto={proyecto.nombre}
            plegando={props.plegando}
            onPlegar={props.onPlegar}
          />
        </div>
      </div>

      <div className="mt-3">
        <ProgresoTarjeta
          hechas={proyecto.tareasHechas ?? 0}
          total={proyecto.tareasTotal ?? 0}
        />
      </div>

      {fundamentoAbierto ? (
        <FundamentoSheet
          proyectoId={proyecto.id}
          proyectoNombre={proyecto.nombre}
          onCerrar={() => setFundamentoAbierto(false)}
        />
      ) : null}
    </div>
  );
}
