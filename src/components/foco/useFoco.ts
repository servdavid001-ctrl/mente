'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  actualizarProyecto,
  crearProyecto,
  listarObjetivos,
  listarProyectos
} from '@/lib/foco';
import type { Objetivo, Proyecto } from '@/lib/types';

const ERROR_CARGA = 'No pudimos cargar tu Foco. Reintentar';
const ERROR_PLIEGUE = 'No se pudo cambiar el proyecto. Reintenta.';

export type ResultadoFoco = ReturnType<typeof useFoco>;

/** datos + acciones del panel de Foco (proyectos y objetivos del usuario) */
export function useFoco() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [sinProyecto, setSinProyecto] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [toast, setToast] = useState<string | null>(null);
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);

  const cargar = useCallback(async (silencioso = false) => {
    if (!silencioso) {
      setCargando(true);
      setError(undefined);
    }
    try {
      const [lista, objetivosUsuario] = await Promise.all([
        listarProyectos(),
        listarObjetivos()
      ]);
      setProyectos(lista.proyectos);
      setSinProyecto(lista.sinProyecto);
      setObjetivos(objetivosUsuario);
    } catch {
      if (!silencioso) setError(ERROR_CARGA);
    } finally {
      if (!silencioso) setCargando(false);
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

  async function crear(datos: { nombre: string; color: string }): Promise<void> {
    const creado = await crearProyecto(datos);
    setProyectos((prev) => [...prev, creado]);
  }

  async function alternarPlegado(proyecto: Proyecto): Promise<void> {
    if (ocupadoId !== null) return;
    const previo = proyecto.plegado;
    const siguiente = !previo;
    setOcupadoId(proyecto.id);
    setProyectos((prev) =>
      prev.map((p) => (p.id === proyecto.id ? { ...p, plegado: siguiente } : p))
    );
    try {
      const actualizado = await actualizarProyecto(proyecto.id, { plegado: siguiente });
      setProyectos((prev) => prev.map((p) => (p.id === proyecto.id ? actualizado : p)));
    } catch {
      setProyectos((prev) =>
        prev.map((p) => (p.id === proyecto.id ? { ...p, plegado: previo } : p))
      );
      setToast(ERROR_PLIEGUE);
    } finally {
      setOcupadoId(null);
    }
  }

  return {
    proyectos,
    objetivos,
    sinProyecto,
    cargando,
    error,
    toast,
    ocupadoId,
    cargar,
    crear,
    alternarPlegado,
    cerrarToast: () => setToast(null)
  };
}
