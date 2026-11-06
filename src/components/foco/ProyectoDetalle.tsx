'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../AppShell';
import PanelesProyecto from './PanelesProyecto';
import { BannerAvisoFoco } from './AvisosFoco';
import { EsqueletoDetalle, SinProyecto } from './EstadosDetalle';
import { useDetalleProyecto } from './useDetalleProyecto';
import { useAccionesIdeas } from './useAccionesIdeas';
import { actualizarProyecto } from '@/lib/foco';
import type { TabId } from '@/lib/types';
import type { ComponentProps } from 'react';

type TabProyecto = NonNullable<ComponentProps<typeof PanelesProyecto>['tab']>;

/** proyecto simplificado (modulo 11): cabecera + tabs Notas/Investigacion/
 * Tareas. Notas = ideas estado 'proyecto'; investigaciones = ideas estado
 * 'investigacion'; todo via API existente (sin tablas nuevas). */
export default function ProyectoDetalle(props: { proyectoId: string; email?: string }) {
  const router = useRouter();
  const detalle = useDetalleProyecto(props.proyectoId);
  const proyecto = detalle.proyecto;
  const [tab, setTab] = useState<TabProyecto>('notas');
  const [plegando, setPlegando] = useState(false);
  const acciones = useAccionesIdeas(props.proyectoId, detalle.cargar);

  const notas = useMemo(
    () => detalle.ideas.filter((i) => i.estado === 'proyecto'),
    [detalle.ideas]
  );
  const investigaciones = useMemo(
    () => detalle.ideas.filter((i) => i.estado === 'investigacion'),
    [detalle.ideas]
  );

  async function plegar() {
    if (!proyecto || plegando) return;
    setPlegando(true);
    try {
      await actualizarProyecto(proyecto.id, { plegado: true });
      router.push('/foco');
    } catch {
      detalle.avisar('No se pudo plegar el proyecto. Reintenta.');
      setPlegando(false);
    }
  }

  return (
    <AppShell
      activeTab={'foco' satisfies TabId}
      titulo={proyecto?.nombre ?? 'Proyecto'}
      email={props.email}
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
      <div className="mx-auto w-full max-w-[64rem]">
        {detalle.cargando && !proyecto ? <EsqueletoDetalle /> : null}
        {detalle.cargando ? null : (
          <div className={detalle.error || detalle.toast ? 'mb-3' : undefined}>
            <BannerAvisoFoco
              error={detalle.error}
              toast={detalle.toast}
              onReintentar={detalle.error ? () => void detalle.cargar() : undefined}
            />
          </div>
        )}
        {!detalle.cargando && !detalle.error && proyecto ? (
          <PanelesProyecto
            proyecto={proyecto}
            plegando={plegando}
            onPlegar={() => void plegar()}
            tab={tab}
            onTab={setTab}
            notas={notas}
            investigaciones={investigaciones}
            objetivos={detalle.objetivos}
            crearIdea={acciones.crearIdea}
            moverIdea={acciones.moverIdea}
          />
        ) : null}
        {!detalle.cargando && !detalle.error && !proyecto ? <SinProyecto /> : null}
      </div>
    </AppShell>
  );
}
