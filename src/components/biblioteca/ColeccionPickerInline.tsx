'use client';

import { useRef, useState } from 'react';
import type { DotColor } from '@/lib/types';
import { DOT_HEX } from '@/lib/biblioteca';
import { Dot } from './ColeccionChip';

const PALETA: DotColor[] = [
  'terracota', 'mostaza', 'oliva', 'petroleo', 'tinta', 'violeta', 'rosa', 'marron'
];

/** fila NUEVA coleccion dentro del CategorizarSheet (spec §5) */
export default function ColeccionPickerInline(props: {
  onCreate: (nombre: string, color?: DotColor) => void;
  nombresExistentes: string[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState<DotColor | null>(null);
  const [duplicado, setDuplicado] = useState(false);

  function crear() {
    const n = nombre.trim();
    if (n.length === 0) return;
    if (n.length > 80) return;
    if (props.nombresExistentes.some((e) => e.toLowerCase() === n.toLowerCase())) {
      setDuplicado(true);
      inputRef.current?.focus();
      inputRef.current?.select();
      return;
    }
    props.onCreate(n, color ?? undefined);
    setNombre('');
    setColor(null);
    setDuplicado(false);
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            if (e.target.value.trim().length > 0) setDuplicado(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              crear();
            }
          }}
          maxLength={80}
          placeholder="Nombre de la coleccion..."
          aria-label="Nombre de la coleccion"
          className="h-11 min-w-0 flex-1 rounded-card border border-border bg-surface px-3 text-[14px] text-text placeholder:text-text-soft"
        />
        <button
          type="button"
          aria-label="Anadir la coleccion nueva"
          onClick={crear}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card border border-border bg-surface text-lg font-medium text-text"
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>

      <p className="text-[12px] text-text-soft" id="legend-dots">
        Color (opcional)
      </p>
      <div role="group" aria-label="Color (opcional)" className="flex items-center gap-2">
        {PALETA.map((token) => {
          const elegido = color === token;
          return (
            <button
              key={token}
              type="button"
              aria-pressed={elegido}
              aria-label={`Color ${token}`}
              onClick={() => setColor(elegido ? null : token)}
              className="flex h-8 w-8 items-center justify-center"
            >
              <span
                aria-hidden="true"
                className={`rounded-full transition-all ${
                  elegido ? 'h-5 w-5 ring-2 ring-accent ring-offset-2 ring-offset-raised' : 'h-4 w-4'
                }`}
                style={{ backgroundColor: DOT_HEX[token] }}
              />
            </button>
          );
        })}
        {/* opcion extra: dot vacio de borde -> sin color */}
        <button
          type="button"
          aria-pressed={color === null}
          aria-label="Sin color"
          onClick={() => setColor(null)}
          className="flex h-8 w-8 items-center justify-center"
        >
          <span
            aria-hidden="true"
            className={`rounded-full border border-border ${color === null ? 'h-5 w-5 ring-2 ring-accent ring-offset-2 ring-offset-raised' : 'h-4 w-4'}`}
          />
        </button>
      </div>

      {duplicado ? (
        <p role="alert" className="text-[12px] text-danger">
          Esa coleccion ya existe
        </p>
      ) : null}
    </div>
  );
}
