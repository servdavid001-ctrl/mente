import { useCallback, useEffect, useState } from 'react';
import { listarTareas } from '@/lib/tareas';
import { alternarTarea, asignarTarea, eliminarTarea, type CtxTareas } from './useTareasTap';
import { agregarSubtareaTarea, agregarTarea } from './useTareasAlta';
import { reordenarTarea } from './useTareasReordenar';
import type { Tarea } from '@/lib/types';

const ERROR_CARGA = 'No pudimos cargar las tareas. Reintentar';

export type ResultadoTareas = ReturnType<typeof useTareasProyecto>;

/* datos + escritura del proyecto de un proyecto (paso 4). El estado vive aqui
 * y las acciones en archivos propios (tap/alta/reordenar) via CtxTareas */
export function useTareasProyecto(proyectoId: string) {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);
  const [ordenando, setOrdenando] = useState(false);
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

  const ctx: CtxTareas = {
    proyectoId,
    tareas,
    ocupadoId,
    ordenando,
    setTareas,
    setOcupadoId,
    setOrdenando,
    avisar: setToast
  };

  return {
    tareas,
    cargando,
    error,
    ocupadoId,
    ordenando,
    toast,
    cargar,
    alternar: (tarea: Tarea) => alternarTarea(ctx, tarea),
    eliminar: (tarea: Tarea) => eliminarTarea(ctx, tarea),
    asignar: (tarea: Tarea, valor: string) => asignarTarea(ctx, tarea, valor),
    agregar: (titulo: string, fecha: string | null) => agregarTarea(ctx, titulo, fecha),
    agregarSubtarea: (parentId: string, titulo: string) =>
      agregarSubtareaTarea(ctx, parentId, titulo),
    reordenar: (tarea: Tarea, direccion: 'arriba' | 'abajo') =>
      reordenarTarea(ctx, tarea, direccion)
  };
}
