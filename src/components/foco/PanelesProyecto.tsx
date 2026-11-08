'use client';

import CuadrosProyecto, { type VistaCuadroGrid } from './CuadrosProyecto';
import ProyectoHeaderV2 from './ProyectoHeaderV2';
import VistaAmpliada from './VistaAmpliada';
import { VistaInvestigacion, VistaNotas } from './VistasLibreta';
import VistaTareas from './VistaTareas';
import type { ResultadoTareas } from '@/components/tareas/useTareasProyecto';
import type { Idea, Objetivo, Proyecto } from '@/lib/types';

/* ventana del proyecto (paso 4): cabecera intacta + 3 cuadros SIN tabs +
 * vista ampliada. Cada cuadro abre su overlay a pantalla completa: tarea -->
 * tablon completo; investigacion y notas --> la libreta existente (el tap de
 * una idea abre su PAGINA con breadcrumb y cierra el overlay). */
export default function PanelesProyecto(props: {
  proyecto: Proyecto;
  plegando: boolean;
  onPlegar: () => void;
  notas: Idea[];
  investigaciones: Idea[];
  objetivos: Objetivo[];
  crearIdea: (texto: string, estado: 'proyecto' | 'investigacion') => Promise<void>;
  abrirPagina: (idea: Idea) => void;
  hijosPor: Record<string, number>;
  tareas: ResultadoTareas;
  vista: VistaCuadroGrid | null;
  onVista: (vista: 'investigacion' | 'notas' | 'tareas' | null) => void;
}) {
  function abrirPaginaConCierre(idea: Idea) {
    props.onVista(null);
    props.abrirPagina(idea);
  }

  return (
    <div className="space-y-4 pt-2">
      <ProyectoHeaderV2
        proyecto={props.proyecto}
        plegando={props.plegando}
        onPlegar={props.onPlegar}
      />
      <CuadrosProyecto
        notas={props.notas}
        investigaciones={props.investigaciones}
        tareas={props.tareas.tareas}
        tareasCargando={props.tareas.cargando}
        proyecto={props.proyecto}
        onAbrir={props.onVista}
      />
      {props.vista === 'tareas' ? (
        <VistaAmpliada titulo="Tareas" onVolver={() => props.onVista(null)}>
          <VistaTareas estado={props.tareas} objetivos={props.objetivos} />
        </VistaAmpliada>
      ) : null}
      {props.vista === 'notas' ? (
        <VistaAmpliada titulo="Notas" onVolver={() => props.onVista(null)}>
          <VistaNotas
            notas={props.notas}
            crearIdea={(texto) => props.crearIdea(texto, 'proyecto')}
            abrirPagina={abrirPaginaConCierre}
            hijosPor={props.hijosPor}
          />
        </VistaAmpliada>
      ) : null}
      {props.vista === 'investigacion' ? (
        <VistaAmpliada titulo="Investigacion" onVolver={() => props.onVista(null)}>
          <VistaInvestigacion
            investigaciones={props.investigaciones}
            crearIdea={(titulo) => props.crearIdea(titulo, 'investigacion')}
            abrirPagina={abrirPaginaConCierre}
            hijosPor={props.hijosPor}
          />
        </VistaAmpliada>
      ) : null}
    </div>
  );
}
