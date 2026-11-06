'use client';

/* modulo 9: grupos de la lista de higiene, agregados por tipo (cap 20 c/u). */

import HigieneFila from './HigieneFila';
import { type AccionesHigiene } from './useHigieneAcciones';
import { type Recomendacion, type RecomendacionTipo } from '@/lib/higiene';

const GRUPOS: Array<{ tipo: RecomendacionTipo; titulo: string }> = [
  { tipo: 'idea_bandeja', titulo: 'Ideas en la bandeja' },
  { tipo: 'idea_biblioteca_apartada', titulo: 'Ideas apartadas en biblioteca' },
  { tipo: 'tarea_vieja', titulo: 'Tareas pendientes' },
  { tipo: 'coleccion_vacia', titulo: 'Colecciones vacias' }
];

type Props = {
  recs: Recomendacion[];
  acciones: AccionesHigiene;
};

export default function GruposHigiene({ recs, acciones }: Props) {
  return (
    <>
      {GRUPOS.map((grupo) => {
        const delTipo = recs.filter((r) => r.tipo === grupo.tipo);
        if (delTipo.length === 0) return null;
        return (
          <section key={grupo.tipo} className="pt-2">
            <h2 className="pb-1 text-[13px] font-semibold uppercase tracking-wide text-text-soft">
              {grupo.titulo}
            </h2>
            <ul className="space-y-2">
              {delTipo.map((rec) => (
                <HigieneFila
                  key={`${rec.tipo}:${rec.id}`}
                  rec={rec}
                  ocupado={acciones.ocupadoId === rec.id}
                  onArchivar={acciones.archivar}
                  onMarcarHecha={acciones.marcarHecha}
                  onEliminar={acciones.eliminar}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
