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
import { useTareasProyecto } from '@/components/tareas/useTareasProyecto';
import type { VistaCuadroGrid } from './CuadrosProyecto';
import { raicesPorEstado } from './raicesProyecto';
import { actualizarProyecto, tituloIdea } from '@/lib/foco';
import type { TabId } from '@/lib/types';

/** proyecto (paso 4, sin tabs): 3 cuadros Investigacion/Notas/Tareas con la
 *  vista ampliada por overlay; el tap de una idea abre su PAGina con
 *  breadcrumb, subpaginas y mover via PUT parent_id. El hook de tareas vive
 *  aqui: alimenta el conteo m/total del cuadro y el tablon del overlay. */
export default function ProyectoDetalle(props: { proyectoId: string; email?: string }) {
  const router = useRouter();
  const detalle = useDetalleProyecto(props.proyectoId);
  const proyecto = detalle.proyecto;
  const [vista, setVista] = useState<VistaCuadroGrid | null>(null);
  const [plegando, setPlegando] = useState(false);
  const acciones = useAccionesIdeas(props.proyectoId, detalle);
  const paginas = usePaginasProyecto(detalle.ideas);
  const tareas = useTareasProyecto(props.proyectoId);

  // nivel 0 (modulo 13): solo ideas raiz; las subpaginas viven por parent_id
  const raices = useMemo(() => raicesPorEstado(detalle.ideas), [detalle.ideas]);

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
            notas={raices.notas}
            investigaciones={raices.investigaciones}
            objetivos={detalle.objetivos}
            plegando={plegando}
            onPlegar={() => void plegar()}
            abrirPagina={paginas.abrir}
            crearIdea={acciones.crearIdea}
            crearSubpagina={acciones.crearSubpaginaEn}
            moverIdea={acciones.moverIdea}
            guardarCuerpo={acciones.guardarCuerpo}
            opcionesDe={paginas.opcionesMover}
            tareas={tareas}
            vista={vista}
            onVista={(nueva) => setVista(nueva)}
          />
        ) : null}
        {!detalle.cargando && !detalle.error && !proyecto ? <SinProyecto /> : null}
      </div>
    </AppShell>
  );
}
