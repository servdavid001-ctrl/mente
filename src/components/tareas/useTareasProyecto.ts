'use client';

import { useCallback, useEffect, useState } from 'react';
import { actualizarTarea, borrarTarea, crearTarea, listarTareas } from '@/lib/tareas';
import type { Tarea } from '@/lib/types';

const ERROR_CARGA = 'No pudimos cargar las tareas. Reintentar';
const ERROR_ACCION = 'No se pudo completar la accion. Reintenta.';

export function useTareasProyecto(proyectoId: string) {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(undefined);
    try {
      setTareas(await listarTareas({ proyectoId }));
    } catch {
      setError(ERROR_CARGA);
    } finally {
      setCargando(false);
    }
  }, [proyectoId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function agregar(titulo: string, fecha: string | null): Promise<void> {
    const creada = await crearTarea({ titulo, fecha, proyecto_id: proyectoId });
    setTareas((prev) => [...prev, creada]);
  }

  async function alternar(tarea: Tarea): Promise<void> {
    if (ocupadoId !== null) return;
    const siguiente = tarea.estado === 'pendiente' ? 'hecha' : 'pendiente';
    setOcupadoId(tarea.id);
    setTareas((prev) =>
      prev.map((t) => (t.id === tarea.id ? { ...t, estado: siguiente } : t))
    );
    try {
      const actualizada = await actualizarTarea(tarea.id, { estado: siguiente });
      setTareas((prev) => prev.map((t) => (t.id === tarea.id ? actualizada : t)));
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

  return {
    tareas,
    cargando,
    error,
    ocupadoId,
    toast,
    cargar,
    agregar,
    alternar,
    eliminar
  };
}
