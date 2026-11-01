'use client';

type TipoFiltro = 'todo' | 'texto' | 'voz' | 'link' | 'arte';

const OPCIONES: { id: TipoFiltro; label: string; aria: string }[] = [
  { id: 'todo', label: 'Todo', aria: 'Filtro tipo: Todo' },
  { id: 'texto', label: 'Texto', aria: 'Filtro tipo: Texto' },
  { id: 'voz', label: 'Voz', aria: 'Filtro tipo: Voz' },
  { id: 'link', label: 'Link', aria: 'Filtro tipo: Link' },
  { id: 'arte', label: 'Arte', aria: 'Filtro tipo: Arte' }
];

/** single-select Todo/Texto/Voz/Link/Arte, h-44, aria-pressed (spec §2) */
export default function TypeFilterSegment(props: {
  value: TipoFiltro;
  onChange: (t: TipoFiltro) => void;
}) {
  return (
    <div className="flex h-11 items-stretch gap-1 rounded-card border border-border bg-surface p-1">
      {OPCIONES.map((op) => {
        const activo = op.id === props.value;
        return (
          <button
            key={op.id}
            type="button"
            aria-pressed={activo}
            aria-label={op.aria}
            onClick={() => props.onChange(op.id)}
            className={`flex h-9 flex-1 items-center justify-center rounded-blob text-[13px] ${
              activo ? 'bg-accent-soft font-semibold text-text' : 'text-text-soft'
            }`}
          >
            <span aria-hidden="true">{op.label}</span>
          </button>
        );
      })}
    </div>
  );
}
