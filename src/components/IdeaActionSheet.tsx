'use client';

import { useEffect, useRef } from 'react';

type Props = {
  /** segunda entrada del flujo Categorizar (spec modulo 2 §3) */
  onCategorizar?: () => void;
  onArchivar: () => void;
  /** dos pasos: pedidos -> confirmacion inline en la misma sheet */
  paso: 'pedidos' | 'confirmar';
  onPedirEliminar: () => void;
  onConfirmarEliminar: () => void;
  onCancelar: () => void;
  onClose: () => void;
};

export default function IdeaActionSheet(props: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  function cerrar() {
    props.onClose();
  }

  function bajar(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) cerrar();
  }

  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>('button')?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') cerrar();
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
        aria-label="¿Que hacemos con esta idea?"
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 rounded-t-blob bg-raised px-4 shadow-pop"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        {props.paso === 'pedidos' ? (
          <>
            <p className="pt-4 text-center font-display text-lg font-semibold">
              ¿Que hacemos con esta idea?
            </p>
            <div className="mt-4 space-y-2">
              {props.onCategorizar ? (
                <button
                  type="button"
                  onClick={props.onCategorizar}
                  className="h-12 w-full rounded-card border border-border text-[15px] font-semibold text-text"
                >
                  Categorizar
                </button>
              ) : null}
              <button
                type="button"
                onClick={props.onArchivar}
                className="h-12 w-full rounded-card bg-accent-soft text-[15px] font-semibold text-text"
              >
                Archivar
              </button>
              <button
                type="button"
                onClick={props.onPedirEliminar}
                className="h-12 w-full rounded-card border border-danger text-[15px] font-semibold text-danger"
              >
                Eliminar para siempre
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="pt-4 text-center font-display text-lg font-semibold">
              Se elimina sin vuelta atras.
            </p>
            <div className="mt-4 space-y-2">
              <button
                type="button"
                aria-label="Botón de eliminar"
                onClick={props.onConfirmarEliminar}
                className="h-12 w-full rounded-card bg-danger text-[15px] font-semibold text-white"
              >
                Eliminar
              </button>
              <button
                type="button"
                onClick={props.onCancelar}
                className="h-12 w-full rounded-card text-[15px] font-semibold text-text-soft"
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
