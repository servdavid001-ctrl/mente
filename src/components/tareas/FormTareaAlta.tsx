'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { MAX_TITULO_TAREA } from '@/lib/tareas';

/* paso 4: alta inline de tarea raiz (titulo + fecha opcional), extraida del
 * TareasProyecto legado para la vista ampliada del cuadro Tareas. El guardado
 * queda en onCrear (lo resuelve el hook ya levantado en el detalle). */
export default function FormTareaAlta(props: {
  onCrear: (titulo: string, fecha: string | null) => Promise<void>;
}) {
  const [titulo, setTitulo] = useState('');
  const [fecha, setFecha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const limpio = titulo.trim();
    if (limpio.length === 0) {
      setError('Escribe la tarea.');
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      await props.onCrear(limpio, fecha || null);
      setTitulo('');
      setFecha('');
    } catch {
      setError('No se pudo crear la tarea. Reintenta.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void enviar(e)}
      className="space-y-2 rounded-card border border-border bg-raised p-3"
    >
      <label htmlFor="tarea-titulo" className="block text-[13px] font-semibold text-text">
        Nueva tarea
      </label>
      <input
        id="tarea-titulo"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        maxLength={MAX_TITULO_TAREA}
        placeholder="Que toca hacer"
        className="h-11 w-full rounded-card border border-border bg-surface px-3 text-[15px] text-text placeholder:text-text-soft"
      />
      <div className="flex gap-2">
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          aria-label="Fecha de la tarea (opcional)"
          className="h-11 min-w-0 flex-1 rounded-card border border-border bg-surface px-3 text-[14px] text-text"
        />
        <button
          type="submit"
          disabled={enviando}
          className="h-11 shrink-0 rounded-card bg-accent px-4 text-[14px] font-semibold text-white disabled:opacity-50"
        >
          {enviando ? 'Guardando...' : 'Anadir'}
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-[12px] text-danger">
          {error}
        </p>
      ) : null}
    </form>
  );
}
