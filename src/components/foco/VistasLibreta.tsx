'use client';

import InvestigacionProyecto from './InvestigacionProyecto';
import NotasProyecto from './NotasProyecto';
import type { Idea } from '@/lib/types';

/* vistas ampliadas de la libreta del proyecto (paso 4): envuelven la libreta
 * EXISTENTE sin tocarla. En Investigacion el tap de una idea abre su PAGINA
 * existente con breadcrumb: el caller cierra el overlay y paginas.abrir
 * deja el detalle montado en esa pagina. */

export function VistaNotas(props: {
  notas: Idea[];
  crearIdea: (texto: string) => Promise<void>;
  abrirPagina: (idea: Idea) => void;
  hijosPor: Record<string, number>;
}) {
  return (
    <NotasProyecto
      ideas={props.notas}
      onNueva={props.crearIdea}
      onAbrir={props.abrirPagina}
      hijosPorIdea={props.hijosPor}
    />
  );
}

export function VistaInvestigacion(props: {
  investigaciones: Idea[];
  crearIdea: (titulo: string) => Promise<void>;
  abrirPagina: (idea: Idea) => void;
  hijosPor: Record<string, number>;
}) {
  return (
    <InvestigacionProyecto
      ideas={props.investigaciones}
      onNueva={props.crearIdea}
      onAbrir={props.abrirPagina}
      hijosPorIdea={props.hijosPor}
    />
  );
}
