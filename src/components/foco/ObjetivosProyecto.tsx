'use client';

import { useState } from 'react';
import ObjetivoForm from './ObjetivoForm';
import { crearTareasDesdeObjetivo, puedeCrearTareasObjetivo } from '@/lib/tareas';
import type { Objetivo } from '@/lib/types';

const ETIQUETA_ESTADO: Record<Objetivo['estado'], string> = {
  activo: 'Activo',
  logrado: 'Logrado',
  archivado: 'Archivado'
};

export default function ObjetivosProyecto(props: {
  objetivos: Objetivo[];
  ocupadoId: string | null;
  onCrear: (datos: { titulo: string; descripcion: string }) => Promise<void>;
  onEstado: (objetivo: Objetivo) => void;
  onBorrar: (id: string) => void;
  onTareasCreadas?: () => void;
}) {
  const [ocupadoTareasId, setOcupadoTareasId] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ id: string; texto: string; error: boolean } | null>(
    null
  );

  async function crearTareas(objetivo: Objetivo) {
    if (ocupadoTareasId !== null) return;
    setOcupadoTareasId(objetivo.id);
    setAviso(null);
    try {
      const resultado = await crearTareasDesdeObjetivo(objetivo.id);
      setAviso({
        id: objetivo.id,
        texto: `${resultado.creadas} ${
          resultado.creadas === 1 ? 'tarea creada' : 'tareas creadas'
        }`,
        error: false
      });
      props.onTareasCreadas?.();
    } catch (fallo: unknown) {
      setAviso({
        id: objetivo.id,
        texto: fallo instanceof Error ? fallo.message : 'No se pudieron crear las tareas.',
        error: true
      });
    } finally {
      setOcupadoTareasId(null);
    }
  }

  return (
    <section aria-label="Objetivos del proyecto" className="space-y-2">
      <h2 className="text-[12px] font-semibold uppercase tracking-wide text-text-soft">
        Objetivos
      </h2>

      {props.objetivos.length === 0 ? (
        <p className="text-[13px] text-text-soft">Aun no hay objetivos. Crea el primero abajo.</p>
      ) : (
        <ul className="space-y-2">
          {props.objetivos.map((objetivo) => (
            <li
              key={objetivo.id}
              className="space-y-1.5 rounded-card border border-border bg-surface p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[15px] font-semibold leading-snug">{objetivo.titulo}</p>
                <span className="shrink-0 rounded-blob bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-text">
                  {ETIQUETA_ESTADO[objetivo.estado]}
                </span>
              </div>
              {objetivo.descripcion ? (
                <p className="whitespace-pre-line text-[13px] leading-snug text-text-soft">
                  {objetivo.descripcion}
                </p>
              ) : null}
              {objetivo.fecha ? (
                <p className="text-[12px] text-text-soft">Fecha: {objetivo.fecha}</p>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled={props.ocupadoId !== null}
                  onClick={() => props.onEstado(objetivo)}
                  className="h-9 rounded-blob border border-border px-3 text-[12px] font-semibold text-text disabled:opacity-50"
                >
                  {objetivo.estado === 'activo' ? 'Marcar logrado' : 'Reactivar'}
                </button>
                {puedeCrearTareasObjetivo(objetivo.descripcion) ? (
                  <button
                    type="button"
                    disabled={ocupadoTareasId !== null}
                    onClick={() => void crearTareas(objetivo)}
                    className="h-9 rounded-blob border border-border px-3 text-[12px] font-semibold text-text disabled:opacity-50"
                  >
                    {ocupadoTareasId === objetivo.id
                      ? 'Creando...'
                      : 'Crear tareas del plan'}
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={props.ocupadoId !== null}
                  onClick={() => props.onBorrar(objetivo.id)}
                  className="h-9 rounded-blob px-3 text-[12px] font-semibold text-danger disabled:opacity-50"
                >
                  Borrar
                </button>
              </div>
              {aviso && aviso.id === objetivo.id ? (
                <p
                  role={aviso.error ? 'alert' : 'status'}
                  className={`text-[12px] ${aviso.error ? 'text-danger' : 'text-success'}`}
                >
                  {aviso.texto}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <ObjetivoForm onCrear={props.onCrear} />
    </section>
  );
}
