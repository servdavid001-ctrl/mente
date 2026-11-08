'use client';

import ObjetivosResumen from './ObjetivosResumen';
import FormTareaAlta from '@/components/tareas/FormTareaAlta';
import TablonTareas from '@/components/tareas/TablonTareas';
import type { Objetivo } from '@/lib/types';
import type { ResultadoTareas } from '@/components/tareas/useTareasProyecto';

/* vista ampliada del cuadro Tareas (paso 4): objetivos del proyecto + alta
 * inline + TablonTareas completo (raices con subtareas anidadas, reorden con
 * flechas, marcar hecha, borrar). El estado vive en el hook ya levantado en
 * el detalle, asi el conteo m/total del cuadro queda sincronizado al viv de
 * escribir aqui. */
export default function VistaTareas(props: {
  estado: ResultadoTareas;
  objetivos: Objetivo[];
}) {
  return (
    <section aria-label="Tareas del proyecto" className="space-y-3">
      <ObjetivosResumen objetivos={props.objetivos} />

      {props.estado.toast ? (
        <p role="alert" className="rounded-card bg-danger px-3 py-2 text-[12px] text-white">
          {props.estado.toast}
        </p>
      ) : null}

      <FormTareaAlta onCrear={(titulo, fecha) => props.estado.agregar(titulo, fecha)} />

      <TablonTareas estado={props.estado} />
    </section>
  );
}
