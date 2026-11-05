'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  COLORES_PROYECTO,
  COLOR_PROYECTO_DEFAULT,
  MAX_NOMBRE_PROYECTO
} from '@/lib/foco';

export default function CrearProyectoInline(props: {
  onCrear: (datos: { nombre: string; color: string }) => Promise<void>;
}) {
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState(COLOR_PROYECTO_DEFAULT);
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
      await props.onCrear({ nombre: limpio, color });
      setNombre('');
    } catch {
      setError('No se pudo crear el proyecto. Reintenta.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void enviar(e)}
      className="space-y-2.5 rounded-card border border-border bg-raised p-3"
    >
      <label htmlFor="nuevo-proyecto" className="block text-[13px] font-semibold text-text">
        Nuevo proyecto
      </label>
      <input
        id="nuevo-proyecto"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre del proyecto"
        maxLength={MAX_NOMBRE_PROYECTO}
        aria-invalid={error !== undefined}
        className="h-11 w-full rounded-card border border-border bg-surface px-3 text-[15px] text-text placeholder:text-text-soft"
      />

      <fieldset>
        <legend className="mb-1.5 text-[12px] text-text-soft">Color</legend>
        <div className="flex flex-wrap gap-2">
          {COLORES_PROYECTO.map((opcion) => {
            const activo = opcion.hex === color;
            return (
              <button
                key={opcion.hex}
                type="button"
                aria-label={`Color ${opcion.nombre}`}
                aria-pressed={activo}
                onClick={() => setColor(opcion.hex)}
                className={`h-8 w-8 rounded-full border border-border ${
                  activo ? 'ring-2 ring-accent ring-offset-2 ring-offset-raised' : ''
                }`}
                style={{ backgroundColor: opcion.hex }}
              />
            );
          })}
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
        className="h-11 w-full rounded-card bg-accent px-4 text-[14px] font-semibold text-white disabled:opacity-50"
      >
        {enviando ? 'Creando...' : 'Crear proyecto'}
      </button>
    </form>
  );
}
