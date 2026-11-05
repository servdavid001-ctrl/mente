'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../AppShell';
import ProyectoHeader from './ProyectoHeader';
import ObjetivosProyecto from './ObjetivosProyecto';
import IdeasProyecto from './IdeasProyecto';
import TareasProyecto from '@/components/tareas/TareasProyecto';
import { useDetalleProyecto } from './useDetalleProyecto';

export default function ProyectoDetalle(props: { proyectoId: string }) {
  const router = useRouter();
  const detalle = useDetalleProyecto(props.proyectoId);
  const proyecto = detalle.proyecto;
  const [tareasVersion, setTareasVersion] = useState(0);

  return (
    <AppShell
      activeTab="foco"
      titulo={proyecto?.nombre ?? 'Proyecto'}
      headerLeft={
        <button
          type="button"
          aria-label="Volver a Foco"
          onClick={() => router.push('/foco')}
          className="flex h-11 w-11 items-center justify-center text-text"
        >
          <span aria-hidden="true">←</span>
        </button>
      }
    >
      {detalle.toast ? (
        <p role="alert" className="mb-3 rounded-card bg-danger px-4 py-2.5 text-sm text-white">
          {detalle.toast}
        </p>
      ) : null}

      {detalle.cargando ? (
        <div className="space-y-3" aria-hidden="true">
          <div className="anim-shimmer h-16 w-full rounded-card bg-border" />
          <div className="anim-shimmer h-24 w-full rounded-card bg-border" />
          <div className="anim-shimmer h-20 w-full rounded-card bg-border" />
        </div>
      ) : null}

      {!detalle.cargando && detalle.error ? (
        <div className="rounded-card bg-danger px-4 py-3 text-sm text-white">
          {detalle.error}
          <button
            type="button"
            onClick={() => void detalle.cargar()}
            className="ml-2 h-9 rounded-blob border border-white px-3 text-[13px] font-semibold"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {!detalle.cargando && !detalle.error && !proyecto ? (
        <div className="space-y-3 pt-10 text-center">
          <p className="font-display text-xl font-semibold">Ese proyecto no existe.</p>
          <button
            type="button"
            onClick={() => router.push('/foco')}
            className="h-11 w-full rounded-card border border-border text-[14px] font-semibold text-text"
          >
            Volver a Foco
          </button>
        </div>
      ) : null}

      {!detalle.cargando && !detalle.error && proyecto ? (
        <div className="space-y-5">
          <ProyectoHeader
            proyecto={proyecto}
            ideasCount={detalle.ideas.length}
            plegando={detalle.plegando}
            onToggle={() => void detalle.alternarPlegado()}
          />

          <ObjetivosProyecto
            objetivos={detalle.objetivos}
            ocupadoId={detalle.objetivoOcupado}
            onCrear={detalle.agregarObjetivo}
            onEstado={(objetivo) => void detalle.cambiarEstado(objetivo)}
            onBorrar={(id) => void detalle.eliminarObjetivo(id)}
            onTareasCreadas={() => setTareasVersion((v) => v + 1)}
          />

          <TareasProyecto key={`tareas-${tareasVersion}`} proyectoId={proyecto.id} />

          <IdeasProyecto ideas={detalle.ideas} />
        </div>
      ) : null}
    </AppShell>
  );
}
