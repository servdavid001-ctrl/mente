'use client';

import { useState } from 'react';
import type { Coleccion, DotColor } from '@/lib/types';
import SheetDialog from '@/components/ui/SheetDialog';
import ColeccionChip, { Dot } from './ColeccionChip';
import ColeccionPickerInline from './ColeccionPickerInline';

export type GuardarCategorionPayload = {
  coleccionesIds: string[];
  nuevas: { nombre: string; color?: DotColor }[];
};

type NuevaPendiente = { nombre: string; color?: DotColor; activa: boolean };

/**
 * sheet "¿Donde vive esta idea?" (spec §3/§5): preview, destino unico
 * Biblioteca, chips multi + inline nueva, Listo; en modo ajustar muestra
 * Quitar de Biblioteca con confirmacion inline.
 */
export default function CategorizarSheet(props: {
  ideaPreview: string;
  colecciones: Coleccion[];
  yaCategorizada?: boolean;
  ocupado?: boolean;
  onSave: (payload: GuardarCategorionPayload) => Promise<void>;
  onQuitar?: () => Promise<void>;
  onCerrar: () => void;
}) {
  const [activas, setActivas] = useState<string[]>([]);
  const [nuevas, setNuevas] = useState<NuevaPendiente[]>([]);
  const [paso, setPaso] = useState<'form' | 'confirmaQuitar'>('form');
  const ocupado = props.ocupado === true;

  function toggle(id: string) {
    if (ocupado) return;
    setActivas((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function crearNueva(nombre: string, color?: DotColor) {
    if (ocupado) return;
    setNuevas((prev) => [...prev, { nombre, color, activa: true }]);
  }

  async function guardar() {
    if (ocupado) return;
    await props.onSave({
      coleccionesIds: activas,
      nuevas: nuevas.filter((n) => n.activa).map(({ nombre, color }) => ({ nombre, color }))
    });
  }

  if (paso === 'confirmaQuitar') {
    return (
      <SheetDialog label="Quitar de Biblioteca" onCerrar={props.onCerrar} ocupado={ocupado}>
        <p className="pt-4 text-center font-display text-lg font-semibold">
          Regresa a la Bandeja sin colecciones.
        </p>
        <div className="mt-4 space-y-2">
          <button
            type="button"
            disabled={ocupado}
            onClick={() => void props.onQuitar?.()}
            className="h-12 w-full rounded-card bg-danger text-[15px] font-semibold text-white disabled:opacity-40"
          >
            Quitar de Biblioteca
          </button>
          <button
            type="button"
            disabled={ocupado}
            onClick={() => setPaso('form')}
            className="h-12 w-full rounded-card text-[15px] font-semibold text-text-soft"
          >
            Cancelar
          </button>
        </div>
      </SheetDialog>
    );
  }

  return (
    <SheetDialog label="¿Donde vive esta idea?" onCerrar={props.onCerrar} ocupado={ocupado}>
      <p className="pt-4 text-center font-display text-lg font-semibold">
        ¿Donde vive esta idea?
      </p>
      <p aria-hidden="true" className="mt-1 truncate px-2 text-center text-[13px] text-text-soft">
        {props.ideaPreview}
      </p>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between rounded-card border border-accent bg-accent-soft px-3 py-2.5">
          <span className="text-[14px] font-semibold text-text">Biblioteca creativa</span>
          <span aria-hidden="true" className="text-accent">
            ✓
          </span>
        </div>
        {/* gestionar expectativa: no es boton muerto, es row gris no-tocable */}
        <div className="flex items-center justify-between rounded-card border border-border px-3 py-2.5 opacity-50">
          <span className="text-[14px] font-medium text-text-soft">A un proyecto</span>
          <span aria-hidden="true" className="text-[13px] text-text-soft">
            viene pronto
          </span>
        </div>
      </div>

      <div
        role="group"
        aria-label="Colecciones"
        className="mt-4 flex flex-wrap gap-2"
      >
        {props.colecciones.map((c) => (
          <ColeccionChip
            key={c.id}
            coleccion={c}
            active={activas.includes(c.id)}
            onToggle={toggle}
          />
        ))}
        {nuevas.map((n, i) => (
          <button
            key={`nueva-${i}`}
            type="button"
            aria-pressed={n.activa}
            aria-label={`Coleccion ${n.nombre}`}
            onClick={() => {
              if (ocupado) return;
              setNuevas((prev) =>
                prev.map((p, j) => (j === i ? { ...p, activa: !p.activa } : p))
              );
            }}
            className={n.activa
              ? 'flex h-8 items-center gap-1.5 rounded-blob border-[1.5px] border-accent bg-accent-soft px-3 text-[13px] font-semibold text-text'
              : 'flex h-8 items-center gap-1.5 rounded-blob border border-border bg-surface px-3 text-[13px] font-medium text-text'}
          >
            <Dot color={n.color} />
            <span aria-hidden="true" className="whitespace-nowrap">
              {n.nombre}
            </span>
          </button>
        ))}
      </div>

      <ColeccionPickerInline
        onCreate={crearNueva}
        nombresExistentes={[
          ...props.colecciones.map((c) => c.nombre),
          ...nuevas.map((n) => n.nombre)
        ]}
      />

      <button
        type="button"
        disabled={ocupado}
        onClick={() => void guardar()}
        className="mt-4 flex h-12 items-center justify-center gap-2 rounded-card bg-accent text-[15px] font-semibold text-white disabled:opacity-60"
      >
        {ocupado ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" /> : null}
        Listo
      </button>

      {props.onQuitar ? (
        <button
          type="button"
          disabled={ocupado}
          onClick={() => setPaso('confirmaQuitar')}
          className="mt-2 h-11 w-full rounded-card border border-danger text-[14px] font-semibold text-danger"
        >
          Quitar de Biblioteca
        </button>
      ) : null}
    </SheetDialog>
  );
}
