'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

/**
 * bottom-sheet dialog del modulo 1 (patron IdeaActionSheet): focus trap,
 * ESC + tap fuera cierran, focus devuelto al trigger. Reutilizada por las
 * sheets del modulo 2 (mismo criterio de accesibilidad spec §7).
 */
export default function SheetDialog(props: {
  label: string;
  onCerrar: () => void;
  /** deshabilita todo mientras una operacion guarda (fondo congelado) */
  ocupado?: boolean;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  function bajar(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) props.onCerrar();
  }

  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>('button')?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !props.ocupado) props.onCerrar();
      if (props.ocupado && e.key !== 'Escape') return;
      const botones = panelRef.current?.querySelectorAll<HTMLElement>('button') ?? [];
      if (e.key === 'Tab' && botones.length > 0) {
        const primero = botones[0];
        const ultimo = botones[botones.length - 1];
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primero.focus();
        }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previo?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50" onMouseDown={bajar}>
      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={props.label}
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute bottom-0 left-1/2 max-h-[80dvh] w-full max-w-md -translate-x-1/2 overflow-y-auto rounded-t-blob bg-raised px-4 shadow-pop"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        {props.children}
      </div>
    </div>
  );
}
