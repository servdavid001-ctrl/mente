'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { MAX_DESC_OBJETIVO, MAX_TITULO_OBJETIVO } from '@/lib/foco';

export default function ObjetivoForm(props: {
  onCrear: (datos: { titulo: string; descripcion: string }) => Promise<void>;
}) {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const limpio = titulo.trim();
    if (limpio.length === 0) {
      setError('Escribe el objetivo.');
      return;
    }
    const texto = descripcion
      .split('\n')
      .map((linea) => linea.trim())
      .filter((linea) => linea.length > 0)
      .join('\n');
    setError(undefined);
    setEnviando(true);
    try {
      await props.onCrear({ titulo: limpio, descripcion: texto });
      setTitulo('');
      setDescripcion('');
    } catch {
      setError('No se pudo crear el objetivo. Reintenta.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void enviar(e)}
      className="space-y-2.5 rounded-card border border-border bg-raised p-3"
    >
      <label htmlFor="objetivo-titulo" className="block text-[13px] font-semibold text-text">
        Nuevo objetivo
      </label>
      <input
        id="objetivo-titulo"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Que quieres lograr"
        maxLength={MAX_TITULO_OBJETIVO}
        className="h-11 w-full rounded-card border border-border bg-surface px-3 text-[15px] text-text placeholder:text-text-soft"
      />
      <textarea
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        rows={3}
        maxLength={MAX_DESC_OBJETIVO}
        aria-label="Pasos o detalle del objetivo (opcional)"
        placeholder="Pasos o detalle (opcional)"
        className="w-full rounded-card border border-border bg-surface px-3 py-2 text-[15px] text-text placeholder:text-text-soft"
      />
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
        {enviando ? 'Guardando...' : 'Añadir objetivo'}
      </button>
    </form>
  );
}
