'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../AppShell';
import InterruptorVistas from './InterruptorVistas';
import { BannerAvisoFoco } from './AvisosFoco';
import { EsqueletoDetalle, SinProyecto } from './EstadosDetalle';
import { useDetalleProyecto } from './useDetalleProyecto';
import { useAccionesIdeas } from './useAccionesIdeas';
import { usePaginasProyecto } from './usePaginasProyecto';
import { actualizarProyecto, tituloIdea } from '@/lib/foco';
import type { TabId } from '@/lib/types';

type TabProyecto = 'notas' | 'investigacion' | 'tareas';

/** proyecto (modulo 11 + 13): tabs Notas/Investigacion/Tareas; el tap de una
 * nota abre su PAGINA con breadcrumb, subpaginas y mover via PUT parent_id */
export default function ProyectoDetalle(props: { proyectoId: string; email?: string }) {
  const router = useRouter();
  const detalle = useDetalleProyecto(props.proyectoId);
  const proyecto = detalle.proyecto;
  const [tab, setTab] = useState<TabProyecto>('notas');
  const [plegando, setPlegando] = useState(false);
  const acciones = useAccionesIdeas(props.proyectoId, detalle);
  const paginas = usePaginasProyecto(detalle.ideas);

  // nivel 0 (modulo 13): solo ideas raiz; las subpaginas viven por parent_id
  const notas = useMemo(
    () => detalle.ideas.filter((i) => i.estado === 'proyecto' && !i.parentId),
    [detalle.ideas]
  );
  const investigaciones = useMemo(
    () => detalle.ideas.filter((i) => i.estado === 'investigacion' && !i.parentId),
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
      titulo={paginas.actual ? tituloIdea(paginas.actual) : (proyecto?.nombre ?? 'Proyecto')}
      email={props.email}
      headerLeft={
        <button
          type="button"
          aria-label={paginas.actual ? 'Volver al proyecto' : 'Volver a Foco'}
          onClick={() => (paginas.actual ? paginas.salir() : router.push('/foco'))}
          className="flex h-11 w-11 items-center justify-center text-text"
        >
          <span aria-hidden="true">←</span>
        </button>
      }
    >
      <div className="mx-auto w-full max-w-[64rem]">
        {/* fix P1: durante la recarga en fondo la vista sigue montada (sin flash
         * ni composer cerrado de mas); el esqueleto solo cubre la carga inicial */}
        {detalle.cargando && !proyecto ? <EsqueletoDetalle /> : null}
        {detalle.cargando && proyecto ? null : (
          <div className={detalle.error || detalle.toast ? 'mb-3' : undefined}>
            <BannerAvisoFoco
              error={detalle.error}
              toast={detalle.toast}
              onReintentar={detalle.error ? () => void detalle.cargar() : undefined}
            />
          </div>
        )}
        {!detalle.error && proyecto ? (
          <InterruptorVistas
            proyecto={proyecto}
            paginas={paginas}
            notas={notas}
            investigaciones={investigaciones}
            objetivos={detalle.objetivos}
            tab={tab}
            onTab={setTab}
            plegando={plegando}
            onPlegar={() => void plegar()}
            abrirPagina={paginas.abrir}
            crearIdea={acciones.crearIdea}
            crearSubpagina={acciones.crearSubpaginaEn}
            moverIdea={acciones.moverIdea}
            opcionesDe={paginas.opcionesMover}
          />
        ) : null}
        {!detalle.cargando && !detalle.error && !proyecto ? <SinProyecto /> : null}
      </div>
    </AppShell>
  );
}
