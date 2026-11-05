'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { crearObjetivo, MAX_DESC_OBJETIVO } from '@/lib/foco';
import type { Objetivo, Proyecto } from '@/lib/types';
import CopilotoForm from './CopilotoForm';
import ObjetivoCreado from './ObjetivoCreado';

/** copiloto sin IA: convierte "que quieres lograr" + pasos en un objetivo real */
export default function Copiloto(props: {
  proyectos: Proyecto[];
  onCreado: (objetivo: Objetivo) => void;
}) {
  const [titulo, setTitulo] = useState('');
  const [pasos, setPasos] = useState('');
  const [proyectoId, setProyectoId] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [creado, setCreado] = useState<Objetivo | null>(null);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const tituloLimpio = titulo.trim();
    if (tituloLimpio.length === 0) {
      setError('Escribe que quieres lograr.');
      return;
    }
    const descripcion = pasos
      .split('\n')
      .map((linea) => linea.trim())
      .filter((linea) => linea.length > 0)
      .join('\n');
    if (descripcion.length > MAX_DESC_OBJETIVO) {
      setError('Los pasos son demasiado largos. Acortalo un poco.');
      return;
    }

    setError(undefined);
    setEnviando(true);
    try {
      const objetivo = await crearObjetivo({
        titulo: tituloLimpio,
        descripcion,
        proyecto_id: proyectoId === '' ? null : proyectoId
      });
      setCreado(objetivo);
      setTitulo('');
      setPasos('');
      props.onCreado(objetivo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el objetivo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section aria-label="Copiloto de objetivos" className="space-y-3">
      <header>
        <h2 className="font-display text-xl font-semibold">Copiloto</h2>
        <p className="text-[13px] text-text-soft">
          Dinos que quieres lograr y lo convertimos en un objetivo con pasos.
        </p>
      </header>

      <CopilotoForm
        titulo={titulo}
        pasos={pasos}
        proyectoId={proyectoId}
        proyectos={props.proyectos}
        enviando={enviando}
        error={error}
        onTitulo={setTitulo}
        onPasos={setPasos}
        onProyecto={setProyectoId}
        onSubmit={(e) => void enviar(e)}
      />

      {creado ? <ObjetivoCreado objetivo={creado} /> : null}
    </section>
  );
}
