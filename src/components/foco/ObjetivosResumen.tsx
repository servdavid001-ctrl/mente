import type { Objetivo } from '@/lib/types';

const ETIQUETA_ESTADO: Record<Objetivo['estado'], string> = {
  activo: 'Activo',
  logrado: 'Logrado',
  archivado: 'Archivado'
};

/** objetivos del proyecto como list simple (modulo 11, spec Tareas tab):
 * se muestran arriba para no perderlos hasta la decision final de David.
 * sin acciones: editarlos queda como hoy (sera decision propia aparte). */
export default function ObjetivosResumen(props: { objetivos: Objetivo[] }) {
  if (props.objetivos.length === 0) {
    return (
      <p className="text-[13px] text-text-soft">
        Sin objetivos. El copiloto de Foco es donde se crean, historico intacto.
      </p>
    );
  }

  return (
    <section aria-label="Objetivos del proyecto" className="space-y-2">
      <h3 className="text-[12px] font-semibold uppercase tracking-wide text-text-soft">
        Objetivos
      </h3>
      <ul className="space-y-1.5">
        {props.objetivos.map((objetivo) => (
          <li
            key={objetivo.id}
            className="rounded-card border border-border bg-surface px-3 py-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 text-[14px] font-semibold leading-snug text-text">
                {objetivo.titulo}
              </p>
              <span className="shrink-0 rounded-blob bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-text">
                {ETIQUETA_ESTADO[objetivo.estado]}
              </span>
            </div>
            {objetivo.descripcion ? (
              <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-text-soft">
                {objetivo.descripcion}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
