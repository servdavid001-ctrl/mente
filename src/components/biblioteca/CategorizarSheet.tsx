'use client';

import { useState } from 'react';
import type { Coleccion, DotColor } from '@/lib/types';
import SheetDialog from '@/components/ui/SheetDialog';
import ColeccionChip, { Dot } from './ColeccionChip';
import ColeccionPickerInline from './ColeccionPickerInline';
import SugerenciaSection from '@/components/ai/SugerenciaSection';
import EnviarProyecto from './EnviarProyecto';

export type GuardarCategorionPayload = {
  coleccionesIds: string[];
  nuevas: { nombre: string; color?: DotColor }[];
};

import type { SugerenciaSheet } from '@/lib/types';
export type { SugerenciaSheet } from '@/lib/types';

type NuevaPendiente = { nombre: string; color?: DotColor; activa: boolean };

/**
 * sheet "¿Donde vive esta idea?" (spec §3/§5): preview, destino unico
 * Biblioteca, chips multi + inline nueva, Listo; en modo ajustar muestra
 * Quitar de Biblioteca con confirmacion inline. Extension modulo 3: con
 * sugerencia llega seleccionada (default deseleccionable) + banner con
 * descarte para siempre (irreversible). Extension modulo 12: "A un proyecto"
 * envia la idea a Notas/Investigacion de un proyecto via el PUT existente.
 */
export default function CategorizarSheet(props: {
  ideaPreview: string;
  colecciones: Coleccion[];
  /** chips ya activas al abrir (modo ajustar en el detalle): refleja el estado */
  iniciales?: string[];
  yaCategorizada?: boolean;
  ocupado?: boolean;
  sugerencia?: SugerenciaSheet;
  onDescartarParaSiempre?: () => Promise<void>;
  /** modulo 12: envio explicito a proyecto; sin el, la fila queda "viene pronto" */
  enviarAProyecto?: (proyectoId: string, estado: 'proyecto' | 'investigacion') => Promise<boolean>;
  onSave: (payload: GuardarCategorionPayload) => Promise<void>;
  onQuitar?: () => Promise<void>;
  onCerrar: () => void;
}) {
  const [activas, setActivas] = useState<string[]>(
    props.sugerencia?.coleccionId
      ? [props.sugerencia.coleccionId, ...(props.iniciales ?? [])]
      : (props.iniciales ?? [])
  );
  const [nuevas, setNuevas] = useState<NuevaPendiente[]>(
    props.sugerencia?.esNueva && props.sugerencia.nombreColeccion
      ? [{ nombre: props.sugerencia.nombreColeccion, color: props.sugerencia.dotColor, activa: true }]
      : []
  );
  const [baneada, setBaneada] = useState(false);
  const [descartando, setDescartando] = useState(false);
  const [paso, setPaso] = useState<'form' | 'confirmaQuitar' | 'proyecto'>('form');
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

  if (paso === 'proyecto' && props.enviarAProyecto) {
    return (
      <SheetDialog label="A un proyecto" onCerrar={props.onCerrar} ocupado={ocupado}>
        <EnviarProyecto
          ocupado={ocupado}
          onEnviar={props.enviarAProyecto}
          onVolver={() => setPaso('form')}
        />
      </SheetDialog>
    );
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

      {props.sugerencia && !baneada ? (
        <SugerenciaSection
          sugerencia={{
            nombreColeccion: props.sugerencia.nombreColeccion,
            esNueva: props.sugerencia.esNueva,
            dotColor: props.sugerencia.dotColor
          }}
          onDescartarParaSiempre={async () => {
            if (descartando || !props.sugerencia) return;
            setDescartando(true);
            await props.onDescartarParaSiempre?.();
            setBaneada(true);
            /* el prellenado se deselecciona (spec 13: deselecciona la chip) */
            if (props.sugerencia.coleccionId) {
              setActivas((prev) => prev.filter((id) => id !== props.sugerencia!.coleccionId));
            }
            setNuevas((prev) => prev.filter((n) => n.nombre !== props.sugerencia!.nombreColeccion));
            setDescartando(false);
          }}
        />
      ) : null}

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between rounded-card border border-accent bg-accent-soft px-3 py-2.5">
          <span className="text-[14px] font-semibold text-text">Biblioteca creativa</span>
          <span aria-hidden="true" className="text-accent">
            ✓
          </span>
        </div>
        {/* modulo 12: envio explicito a proyecto con el PUT existente; la fila
            editable abre el paso de proyectos. Sin callback se ve como antes */}
        {props.enviarAProyecto ? (
          <button
            type="button"
            aria-label="Enviar a un proyecto"
            disabled={ocupado}
            onClick={() => setPaso('proyecto')}
            className="flex w-full items-center justify-between rounded-card border border-border bg-surface px-3 py-2.5 disabled:opacity-60"
          >
            <span className="text-[14px] font-medium text-text">A un proyecto</span>
            <span aria-hidden="true" className="text-[13px] text-text-soft">
              →
            </span>
          </button>
        ) : (
          <div className="flex items-center justify-between rounded-card border border-border px-3 py-2.5 opacity-50">
            <span className="text-[14px] font-medium text-text-soft">A un proyecto</span>
            <span aria-hidden="true" className="text-[13px] text-text-soft">
              viene pronto
            </span>
          </div>
        )}
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
