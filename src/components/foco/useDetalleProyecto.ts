'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  actualizarObjetivo,
  actualizarProyecto,
  borrarObjetivo,
  cargarProyecto,
  crearObjetivo
} from '@/lib/foco';
import { sincronizarHijos, upsertIdeas } from '@/lib/ideasTree';
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

  const cargar = useCallback(async (enFondo: boolean = false) => {
    setCargando(true);
    try {
      const datos = await cargarProyecto(proyectoId);
      setProyecto(datos.proyecto);
      setObjetivos(datos.objetivos);
      setIdeas(datos.ideas);
      setError(undefined);
    } catch {
      // fix P1: en fondo (tras guardar OK) el fallo es toast no bloqueante; en
      // carga inicial/reintento conserva el banner error con reintentar
      if (enFondo) {
        setToast('No pudimos actualizar el detalle. Reintenta.');
      } else {
        setError(ERROR_CARGA);
      }
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

  // fix P1 2026-11-07: insert inmediato con la idea confirmada por el server
  // (POST 201) y reemplazo del subarbol de la pagina con el GET ?parent fresco.
  // Duplicados imposibles por id; el tree recomputa hijas/badges al instante
  function agregarIdea(idea: Idea): void {
    setIdeas((prev) => upsertIdeas(prev, [idea]));
  }

  function sincronizarHijosPagina(parentId: string, hijos: Idea[]): void {
    setIdeas((prev) => sincronizarHijos(prev, parentId, hijos));
  }

  /** PUT parent_id confirmado: reparenta la idea en el arbol local (la lista
   * de origen y el badge del padre nuevo se recomputan al instante) */
  function moverIdeaLocal(ideaId: string, parentId: string | null): void {
    setIdeas((prev) => prev.map((idea) => (idea.id === ideaId ? { ...idea, parentId } : idea)));
  }

  /** modulo 14: PUT contenido confirmado; el texto del server (cap 2000) pasa
   * al arbol al instante y el cuerpo se ve "alli debajo" re-renderizado */
  function actualizarCuerpoIdea(ideaId: string, texto: string): void {
    setIdeas((prev) => prev.map((idea) => (idea.id === ideaId ? { ...idea, text: texto } : idea)));
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
    agregarIdea,
    sincronizarHijosPagina,
    moverIdeaLocal,
    actualizarCuerpoIdea,
    alternarPlegado,
    agregarObjetivo,
    cambiarEstado,
    eliminarObjetivo,
    cerrarToast: () => setToast(null),
    avisar: (mensaje: string) => setToast(mensaje)
  };
}
