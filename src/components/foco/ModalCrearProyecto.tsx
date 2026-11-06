'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import SheetDialog from '@/components/ui/SheetDialog';
import {
  COLORES_PROYECTO,
  COLOR_PROYECTO_DEFAULT,
  MAX_DESC_PROYECTO,
  MAX_NOMBRE_PROYECTO
} from '@/lib/foco';

/** modal "+" (modulo 11, spec §4): crear proyecto con nombre + color +
 * descripcion opcional. Al guardar el caller recarga y la tarjeta aparece. */
export default function ModalCrearProyecto(props: {
  onCerrar: () => void;
  onCrear: (datos: { nombre: string; color: string; descripcion: string | null }) => Promise<void>;
}) {
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState(COLOR_PROYECTO_DEFAULT);
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const limpio = nombre.trim();
    if (limpio.length === 0) {
      setError('Ponle un nombre al proyecto.');
      return;
    }
    setError(undefined);
    setEnviando(true);
    try {
      await props.onCrear({
        nombre: limpio,
        color,
        descripcion: descripcion.trim() === '' ? null : descripcion.trim()
      });
      props.onCerrar();
    } catch {
      setError('No se pudo crear el proyecto. Reintenta.');
      setEnviando(false);
    }
  }

  return (
    <SheetDialog label="Crear proyecto" onCerrar={props.onCerrar} ocupado={enviando}>
      <form
        onSubmit={(e) => void enviar(e)}
        className="space-y-2.5 pb-2 pt-4"
      >
        <p className="text-center font-display text-lg font-semibold">Crear proyecto</p>

        <label htmlFor="modal-proyecto-nombre" className="block text-[13px] font-semibold text-text">
          Nombre
        </label>
        <input
          id="modal-proyecto-nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={MAX_NOMBRE_PROYECTO}
          placeholder="Nombre del proyecto"
          className="h-11 w-full rounded-card border border-border bg-surface px-3 text-[15px] text-text placeholder:text-text-soft"
        />

        <label
          htmlFor="modal-proyecto-desc"
          className="block pt-1 text-[13px] font-semibold text-text"
        >
          Descripcion (opcional)
        </label>
        <textarea
          id="modal-proyecto-desc"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          maxLength={MAX_DESC_PROYECTO}
          rows={2}
          placeholder="De que va el proyecto"
          className="w-full rounded-card border border-border bg-surface px-3 py-2 text-[14px] text-text placeholder:text-text-soft"
        />

        <fieldset>
          <legend className="mb-1.5 pt-1 text-[12px] text-text-soft">Color</legend>
          <div className="flex flex-wrap gap-2">
            {COLORES_PROYECTO.map((opcion) => (
              <button
                key={opcion.hex}
                type="button"
                aria-label={`Color ${opcion.nombre}`}
                aria-pressed={opcion.hex === color}
                onClick={() => setColor(opcion.hex)}
                className={`h-8 w-8 rounded-full border border-border ${
                  opcion.hex === color
                    ? 'ring-2 ring-accent ring-offset-2 ring-offset-raised'
                    : ''
                }`}
                style={{ backgroundColor: opcion.hex }}
              />
            ))}
          </div>
        </fieldset>

        {error ? (
          <p role="alert" className="text-[12px] text-danger">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={enviando}
          className="h-12 w-full rounded-card bg-accent text-[15px] font-semibold text-white disabled:opacity-60"
        >
          {enviando ? 'Creando...' : 'Crear proyecto'}
        </button>
      </form>
    </SheetDialog>
  );
}
