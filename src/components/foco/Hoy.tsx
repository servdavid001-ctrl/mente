'use client';

import { useCallback, useEffect, useState } from 'react';
import ListaTareas from '@/components/tareas/ListaTareas';
import { listarProyectos } from '@/lib/foco';
import { actualizarTarea, borrarTarea, listarTareas } from '@/lib/tareas';
import type { Tarea } from '@/lib/types';

const ERROR_CARGA = 'No pudimos cargar las tareas de hoy. Reintentar';
const ERROR_ACCION = 'No se pudo completar la accion. Reintenta.';

/** seccion "Hoy": pendientes de hoy o sin fecha de todos los proyectos */
export default function Hoy() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [proyectos, setProyectos] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(undefined);
    try {
      const [lista, tareasHoy] = await Promise.all([
        listarProyectos(),
        listarTareas({ hoy: true })
      ]);
      const mapa: Record<string, string> = {};
      for (const proyecto of lista.proyectos) mapa[proyecto.id] = proyecto.nombre;
      setProyectos(mapa);
      setTareas(tareasHoy);
    } catch {
      setError(ERROR_CARGA);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function alternar(tarea: Tarea): Promise<void> {
    if (ocupadoId !== null) return;
    setOcupadoId(tarea.id);
    setTareas((prev) =>
      prev.map((t) => (t.id === tarea.id ? { ...t, estado: 'hecha' } : t))
    );
    try {
      await actualizarTarea(tarea.id, { estado: 'hecha' });
      setTareas((prev) => prev.filter((t) => t.id !== tarea.id));
    } catch {
      setTareas((prev) =>
        prev.map((t) => (t.id === tarea.id ? { ...t, estado: tarea.estado } : t))
      );
      setToast(ERROR_ACCION);
    } finally {
      setOcupadoId(null);
    }
  }

  async function eliminar(tarea: Tarea): Promise<void> {
    if (ocupadoId !== null) return;
    setOcupadoId(tarea.id);
    try {
      await borrarTarea(tarea.id);
      setTareas((prev) => prev.filter((t) => t.id !== tarea.id));
    } catch {
      setToast(ERROR_ACCION);
    } finally {
      setOcupadoId(null);
    }
  }

  return (
    <section aria-label="Tareas de hoy" className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[12px] font-semibold uppercase tracking-wide text-text-soft">
          Hoy
        </h2>
        <span className="text-[12px] text-text-soft">
          {tareas.length} {tareas.length === 1 ? 'pendiente' : 'pendientes'}
        </span>
      </div>

      {toast ? (
        <p role="alert" className="rounded-card bg-danger px-3 py-2 text-[12px] text-white">
          {toast}
        </p>
      ) : null}

      <ListaTareas
        tareas={tareas}
        cargando={cargando}
        error={error}
        vacio="Nada para hoy. Tu dia esta libre."
        ocupadoId={ocupadoId}
        proyectoDe={(tarea) =>
          tarea.proyectoId && proyectos[tarea.proyectoId]
            ? { nombre: proyectos[tarea.proyectoId], href: `/foco/${tarea.proyectoId}` }
            : null
        }
        onToggle={(tarea) => void alternar(tarea)}
        onBorrar={(tarea) => void eliminar(tarea)}
        onReintentar={() => void cargar()}
      />
    </section>
  );
}
