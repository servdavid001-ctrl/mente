'use client';

import type { FormEvent } from 'react';
import { MAX_DESC_OBJETIVO, MAX_TITULO_OBJETIVO } from '@/lib/foco';
import type { Proyecto } from '@/lib/types';

export default function CopilotoForm(props: {
  titulo: string;
  pasos: string;
  proyectoId: string;
  proyectos: Proyecto[];
  enviando: boolean;
  error?: string;
  onTitulo: (valor: string) => void;
  onPasos: (valor: string) => void;
  onProyecto: (valor: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      onSubmit={props.onSubmit}
      className="space-y-2.5 rounded-card border border-border bg-raised p-3"
    >
      <label htmlFor="copiloto-titulo" className="block text-[13px] font-semibold text-text">
        ¿Que quieres lograr?
      </label>
      <input
        id="copiloto-titulo"
        value={props.titulo}
        onChange={(e) => props.onTitulo(e.target.value)}
        placeholder="Ej: terminar el primer capitulo"
        maxLength={MAX_TITULO_OBJETIVO}
        className="h-11 w-full rounded-card border border-border bg-surface px-3 text-[15px] text-text placeholder:text-text-soft"
      />

      <label htmlFor="copiloto-pasos" className="block text-[13px] font-semibold text-text">
        Un paso por linea
      </label>
      <textarea
        id="copiloto-pasos"
        value={props.pasos}
        onChange={(e) => props.onPasos(e.target.value)}
        rows={4}
        maxLength={MAX_DESC_OBJETIVO}
        placeholder={'Investigar el tema\nEscribir un borrador\nRevisarlo'}
        className="w-full rounded-card border border-border bg-surface px-3 py-2 text-[15px] text-text placeholder:text-text-soft"
      />

      <label htmlFor="copiloto-proyecto" className="block text-[13px] font-semibold text-text">
        Proyecto (opcional)
      </label>
      <select
        id="copiloto-proyecto"
        value={props.proyectoId}
        onChange={(e) => props.onProyecto(e.target.value)}
        className="h-11 w-full rounded-card border border-border bg-surface px-3 text-[15px] text-text"
      >
        <option value="">Sin proyecto</option>
        {props.proyectos.map((proyecto) => (
          <option key={proyecto.id} value={proyecto.id}>
            {proyecto.nombre}
          </option>
        ))}
      </select>

      {props.error ? (
        <p role="alert" className="text-[12px] text-danger">
          {props.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={props.enviando}
        className="h-11 w-full rounded-card bg-accent px-4 text-[14px] font-semibold text-white disabled:opacity-50"
      >
        {props.enviando ? 'Guardando...' : 'Guardar objetivo'}
      </button>
    </form>
  );
}
