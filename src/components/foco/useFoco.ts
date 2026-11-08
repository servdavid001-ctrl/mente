'use client';

import { useCallback, useEffect, useState } from 'react';
import { actualizarProyecto, crearProyecto, listarProyectos } from '@/lib/foco';
import type { Proyecto } from '@/lib/types';

const ERROR_CARGA = 'No pudimos cargar tu Foco. Reintentar';
const ERROR_PLIEGUE = 'No se pudo cambiar el proyecto. Reintenta.';

export type ResultadoFoco = ReturnType<typeof useFoco>;

/** datos + acciones del panel de Foco (proyectos del usuario) */
export function useFoco() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [toast, setToast] = useState<string | null>(null);
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(undefined);
    try {
      const lista = await listarProyectos();
      setProyectos(lista.proyectos);
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

  async function crear(datos: {
    nombre: string;
    color: string;
    descripcion?: string | null;
  }): Promise<void> {
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
