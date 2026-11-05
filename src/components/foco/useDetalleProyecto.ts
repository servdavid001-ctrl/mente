'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  actualizarObjetivo,
  actualizarProyecto,
  borrarObjetivo,
  cargarProyecto,
  crearObjetivo
} from '@/lib/foco';
import type { Idea, Objetivo, Proyecto } from '@/lib/types';

const ERROR_CARGA = 'No pudimos cargar el proyecto. Reintentar';
const ERROR_ACCION = 'No se pudo completar la accion. Reintenta.';

export type ResultadoDetalle = ReturnType<typeof useDetalleProyecto>;

/** datos + acciones de la pagina /foco/[id] */
export function useDetalleProyecto(proyectoId: string) {
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [toast, setToast] = useState<string | null>(null);
  const [plegando, setPlegando] = useState(false);
  const [objetivoOcupado, setObjetivoOcupado] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(undefined);
    try {
      const datos = await cargarProyecto(proyectoId);
      setProyecto(datos.proyecto);
      setObjetivos(datos.objetivos);
      setIdeas(datos.ideas);
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

  async function alternarPlegado(): Promise<void> {
    if (!proyecto || plegando) return;
    const previo = proyecto.plegado;
    setPlegando(true);
    setProyecto({ ...proyecto, plegado: !previo });
    try {
      const actualizado = await actualizarProyecto(proyecto.id, { plegado: !previo });
      setProyecto(actualizado);
    } catch {
      setProyecto((prev) => (prev ? { ...prev, plegado: previo } : prev));
      setToast(ERROR_ACCION);
    } finally {
      setPlegando(false);
    }
  }

  async function agregarObjetivo(datos: {
    titulo: string;
    descripcion: string;
  }): Promise<void> {
    if (!proyecto) throw new Error('Proyecto no disponible');
    const creado = await crearObjetivo({ ...datos, proyecto_id: proyecto.id });
    setObjetivos((prev) => [creado, ...prev]);
    setProyecto((prev) =>
      prev
        ? { ...prev, objetivosActivos: prev.objetivosActivos + (creado.estado === 'activo' ? 1 : 0) }
        : prev
    );
  }

  async function cambiarEstado(objetivo: Objetivo): Promise<void> {
    if (objetivoOcupado !== null) return;
    const siguiente = objetivo.estado === 'activo' ? 'logrado' : 'activo';
    setObjetivoOcupado(objetivo.id);
    try {
      const actualizado = await actualizarObjetivo(objetivo.id, { estado: siguiente });
      setObjetivos((prev) => prev.map((o) => (o.id === objetivo.id ? actualizado : o)));
      const delta =
        (actualizado.estado === 'activo' ? 1 : 0) - (objetivo.estado === 'activo' ? 1 : 0);
      setProyecto((prev) =>
        prev ? { ...prev, objetivosActivos: Math.max(0, prev.objetivosActivos + delta) } : prev
      );
    } catch {
      setToast(ERROR_ACCION);
    } finally {
      setObjetivoOcupado(null);
    }
  }

  async function eliminarObjetivo(id: string): Promise<void> {
    if (objetivoOcupado !== null) return;
    const objetivo = objetivos.find((o) => o.id === id);
    if (!objetivo) return;
    setObjetivoOcupado(id);
    try {
      await borrarObjetivo(id);
      setObjetivos((prev) => prev.filter((o) => o.id !== id));
      if (objetivo.estado === 'activo') {
        setProyecto((prev) =>
          prev ? { ...prev, objetivosActivos: Math.max(0, prev.objetivosActivos - 1) } : prev
        );
      }
    } catch {
      setToast(ERROR_ACCION);
    } finally {
      setObjetivoOcupado(null);
    }
  }

  return {
    proyecto,
    objetivos,
    ideas,
    cargando,
    error,
    toast,
    plegando,
    objetivoOcupado,
    cargar,
    alternarPlegado,
    agregarObjetivo,
    cambiarEstado,
    eliminarObjetivo,
    cerrarToast: () => setToast(null)
  };
}
