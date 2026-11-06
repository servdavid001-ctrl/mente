'use client';

import PanelesProyecto from './PanelesProyecto';
import PaginaIdea from './PaginaIdea';
import type { VistaPaginas } from './usePaginasProyecto';
import type { Idea, Objetivo, Proyecto } from '@/lib/types';
import type { OpcionMover } from './MoverMenu';
import type { ComponentProps } from 'react';

type PropsPaneles = ComponentProps<typeof PanelesProyecto>;

/** interruptor del detalle de proyecto (modulo 13): sin ruta abierta muestra
 * los paneles (tabs); con ruta abierta muestra la PAGINA de esa idea raiz o
 * subpagina. La composicion vive en ProyectoDetalle; aqui solo la eleccion */
export default function InterruptorVistas(props: {
  proyecto: Proyecto;
  paginas: VistaPaginas;
  notas: Idea[];
  investigaciones: Idea[];
  objetivos: Objetivo[];
  tab: PropsPaneles['tab'];
  onTab: PropsPaneles['onTab'];
  plegando: boolean;
  onPlegar: () => void;
  abrirPagina: (idea: Idea) => void;
  crearIdea: PropsPaneles['crearIdea'];
  crearSubpagina: (texto: string, estado: 'proyecto' | 'investigacion', parentId: string) => Promise<void>;
  moverIdea: (ideaId: string, parentId: string | null) => Promise<void>;
  opcionesDe: (hija: Idea) => OpcionMover[];
}) {
  const actual = props.paginas.actual;
  if (actual === null) {
    return (
      <PanelesProyecto
        proyecto={props.proyecto}
        plegando={props.plegando}
        onPlegar={props.onPlegar}
        tab={props.tab}
        onTab={props.onTab}
        notas={props.notas}
        investigaciones={props.investigaciones}
        objetivos={props.objetivos}
        crearIdea={props.crearIdea}
        abrirPagina={props.abrirPagina}
        hijosPor={props.paginas.hijosPor}
      />
    );
  }
  return (
    <PaginaIdea
      proyecto={props.proyecto}
      ruta={props.paginas.ruta}
      actual={actual}
      hijas={props.paginas.hijas}
      hijosPor={props.paginas.hijosPor}
      opcionesDe={props.opcionesDe}
      onAbrir={props.paginas.abrir}
      onVolverAProyecto={props.paginas.salir}
      onIrANivel={props.paginas.irA}
      crearSubpagina={props.crearSubpagina}
      moverIdea={props.moverIdea}
    />
  );
}
