'use client';

import type { ReactNode } from 'react';

/** barra de tabs del proyecto (modulo 11): Notas | Investigacion | Tareas.
 * 3 botones, estado controlado por el caller, accesible con roles ARIA.
 * sin tildes en strings JSX (regla del repo). */
export default function TabsProyecto(props: {
  activo: 'notas' | 'investigacion' | 'tareas';
  onCambiar: (tab: 'notas' | 'investigacion' | 'tareas') => void;
  conteos: { notas: number; investigacion: number; tareas: number };
  children: ReactNode;
}) {
  const tabs = [
    { id: 'notas' as const, etiqueta: 'Notas', conteo: props.conteos.notas },
    {
      id: 'investigacion' as const,
      etiqueta: 'Investigacion',
      conteo: props.conteos.investigacion
    },
    { id: 'tareas' as const, etiqueta: 'Tareas', conteo: props.conteos.tareas }
  ];

  return (
    <>
      <div
        role="tablist"
        aria-label="Apartados del proyecto"
        className="flex gap-1 rounded-card border border-border bg-raised p-1"
      >
        {tabs.map((tab) => {
          const activo = tab.id === props.activo;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activo}
              onClick={() => props.onCambiar(tab.id)}
              className={`h-10 flex-1 rounded-blob text-[14px] font-semibold transition-colors ${
                activo
                  ? 'bg-accent text-white'
                  : 'text-text-soft hover:text-text'
              }`}
            >
              {tab.etiqueta}
              <span className="ml-1 text-[12px] font-medium opacity-80">{tab.conteo}</span>
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="space-y-4">
        {props.children}
      </div>
    </>
  );
}
