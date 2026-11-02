'use client';

import { useRef, useState } from 'react';
import { parseNota } from '@/lib/biblioteca';

/**
 * textarea auto-crece + [B]/[bullet] minimal (spec §1 limites: solo parrafos,
 * **negrita** y viñetas). La sintaxis minima vive en el propio valor.
 */
export default function NotaEditor(props: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => Promise<void>;
}) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [guardando, setGuardando] = useState(false);

  const rows = useCallbackAutogrow(areaRef, props.value);

  async function marcar(tipo: 'negrita' | 'vineta') {
    const el = areaRef.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const texto = props.value;
    if (tipo === 'negrita') {
      const sel = texto.slice(a, b);
      const nuevo = `${texto.slice(0, a)}**${sel || 'palabras'}**${texto.slice(b)}`;
      props.onChange(nuevo);
    } else {
      const inicioLinea = texto.lastIndexOf('\n', a - 1) + 1;
      const nuevo = `${texto.slice(0, inicioLinea)}- ${texto.slice(inicioLinea)}`;
      props.onChange(nuevo);
    }
    requestAnimationFrame(() => el.focus());
  }

  async function alSalier() {
    if (parseNota(props.value).length === 0 && props.value.trim() === '') return; // nada que guardar
    setGuardando(true);
    try {
      await props.onSave();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-1 pb-1">
        <button
          type="button"
          aria-label="Poner negrita en la seleccion"
          onClick={() => void marcar('negrita')}
          className="flex h-11 w-11 items-center justify-center rounded-card text-[14px] font-semibold text-text"
        >
          <span aria-hidden="true">B</span>
        </button>
        <button
          type="button"
          aria-label="Poner una viñeta en esta linea"
          onClick={() => void marcar('vineta')}
          className="flex h-11 w-11 items-center justify-center rounded-card text-text-soft"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            •
          </span>
        </button>
        {guardando ? (
          <span role="status" aria-live="polite" className="text-[12px] text-text-soft">
            Guardando...
          </span>
        ) : null}
      </div>
      <textarea
        ref={areaRef}
        rows={Math.max(2, rows)}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        onBlur={() => void alSalier()}
        placeholder="Escribe algo sobre esta idea..."
        aria-label="Nota de la idea"
        maxLength={20000}
        className="w-full resize-none rounded-card border border-border bg-surface px-3 py-2 text-[14px] leading-relaxed text-text placeholder:text-text-soft"
      />
    </div>
  );
}

/** auto-grow simple: cuenta saltos de linea del valor */
function useCallbackAutogrow(
  _ref: React.RefObject<HTMLTextAreaElement | null>,
  valor: string
): number {
  return valor.split('\n').length + (valor.endsWith('\n') ? 1 : 0);
}
