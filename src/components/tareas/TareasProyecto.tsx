'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import ListaTareas from './ListaTareas';
import { useTareasProyecto } from './useTareasProyecto';
import { MAX_TITULO_TAREA } from '@/lib/tareas';

/** tareas del proyecto: alta inline (titulo + fecha opcional) y lista viva */
export default function TareasProyecto(props: { proyectoId: string }) {
  const tareas = useTareasProyecto(props.proyectoId);
  const [titulo, setTitulo] = useState('');
  const [fecha, setFecha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | undefined>();

  const pendientes = tareas.tareas.filter((t) => t.estado === 'pendiente').length;

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const limpio = titulo.trim();
    if (limpio.length === 0) {
      setErrorForm('Escribe la tarea.');
      return;
    }
    setErrorForm(undefined);
    setEnviando(true);
    try {
      await tareas.agregar(limpio, fecha || null);
      setTitulo('');
      setFecha('');
    } catch {
      setErrorForm('No se pudo crear la tarea. Reintenta.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section aria-label="Tareas del proyecto" className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[12px] font-semibold uppercase tracking-wide text-text-soft">
          Tareas
        </h2>
        <span className="text-[12px] text-text-soft">
          {pendientes} {pendientes === 1 ? 'pendiente' : 'pendientes'}
        </span>
      </div>

      {tareas.toast ? (
        <p role="alert" className="rounded-card bg-danger px-3 py-2 text-[12px] text-white">
          {tareas.toast}
        </p>
      ) : null}

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
        {errorForm ? (
          <p role="alert" className="text-[12px] text-danger">
            {errorForm}
          </p>
        ) : null}
      </form>

      <ListaTareas
        tareas={tareas.tareas}
        cargando={tareas.cargando}
        error={tareas.error}
        vacio="Este proyecto aun no tiene tareas."
        ocupadoId={tareas.ocupadoId}
        onToggle={(tarea) => void tareas.alternar(tarea)}
        onBorrar={(tarea) => void tareas.eliminar(tarea)}
        onReintentar={() => void tareas.cargar()}
      />
    </section>
  );
}
