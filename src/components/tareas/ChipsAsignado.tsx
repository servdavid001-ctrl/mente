'use client';

import type { Tarea } from '@/lib/types';

/** chips asignado_a: yo / opencode / muse / grok (reparto del modulo 15) */
export const CHIPS_ASIGNADO = ['yo', 'opencode', 'muse', 'grok'] as const;

export default function ChipsAsignado(props: {
  tarea: Tarea;
  ocupado?: boolean;
  onAsignar: (tarea: Tarea, valor: string) => void;
}) {
  const actual = props.tarea.asignado_a ?? 'yo';
  return (
    <span
      className="mt-1 flex flex-wrap gap-1"
      role="group"
      aria-label="Asignar la tarea a"
    >
      {CHIPS_ASIGNADO.map((valor) => (
        <button
          key={valor}
          type="button"
          disabled={props.ocupado}
          aria-pressed={actual === valor}
          onClick={() => props.onAsignar(props.tarea, valor)}
          className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold disabled:opacity-50 ${
            actual === valor
              ? 'border-transparent bg-accent-soft text-text'
              : 'border-border text-text-soft hover:text-text'
          }`}
        >
          {valor}
        </button>
      ))}
    </span>
  );
}
