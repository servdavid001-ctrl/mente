'use client';

import ProyectoHeaderV2 from './ProyectoHeaderV2';
import TabsProyecto from './TabsProyecto';
import NotasProyecto from './NotasProyecto';
import InvestigacionProyecto from './InvestigacionProyecto';
import ObjetivosResumen from './ObjetivosResumen';
import TareasProyecto from '@/components/tareas/TareasProyecto';
import type { Idea, Objetivo, Proyecto } from '@/lib/types';

/** pane de contenido del proyecto (modulo 11): cabecera + tabs con los tres
 * apartados. Solo composicion; el estado y las acciones viven en el caller. */
export default function PanelesProyecto(props: {
  proyecto: Proyecto;
  plegando: boolean;
  onPlegar: () => void;
  tab: 'notas' | 'investigacion' | 'tareas';
  onTab: (tab: 'notas' | 'investigacion' | 'tareas') => void;
  notas: Idea[];
  investigaciones: Idea[];
  objetivos: Objetivo[];
  crearIdea: (texto: string, estado: 'proyecto' | 'investigacion') => Promise<void>;
  moverIdea: (ideaId: string) => Promise<void>;
}) {
  return (
    <div className="space-y-4 pt-2">
      <ProyectoHeaderV2
        proyecto={props.proyecto}
        plegando={props.plegando}
        onPlegar={props.onPlegar}
      />
      <TabsProyecto
        activo={props.tab}
        onCambiar={props.onTab}
        conteos={{
          notas: props.notas.length,
          investigacion: props.investigaciones.length,
          tareas: props.proyecto.tareasTotal ?? 0
        }}
      >
        {props.tab === 'notas' ? (
          <NotasProyecto
            ideas={props.notas}
            onNueva={(texto) => props.crearIdea(texto, 'proyecto')}
            onMover={(idea) => props.moverIdea(idea.id)}
          />
        ) : null}
        {props.tab === 'investigacion' ? (
          <InvestigacionProyecto
            ideas={props.investigaciones}
            onNueva={(titulo) => props.crearIdea(titulo, 'investigacion')}
          />
        ) : null}
        {props.tab === 'tareas' ? (
          <>
            <ObjetivosResumen objetivos={props.objetivos} />
            <TareasProyecto proyectoId={props.proyecto.id} />
          </>
        ) : null}
      </TabsProyecto>
    </div>
  );
}
