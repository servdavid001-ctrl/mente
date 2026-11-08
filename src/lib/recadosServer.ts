import type { createClient } from '@/utils/supabase/server';
import { COLOR_PROYECTO_DEFAULT } from './foco';
import { PREFIJO_FUNDAMENTO } from './fundamento';
import { COLS_PROYECTO } from './focoServer';
import type { Tarea } from './types';

/* servidor del paquete de recado (modulo 16 A): carga del contexto por RLS
 * (proyecto, objetivo activo mas reciente del proyecto, pagina del
 * fundamento del proyecto si existe). Lectura pura, nada se escribe. */

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type ContextoRecado = {
  proyecto: { nombre: string; color: string } | null;
  objetivo: string | null;
  fundamento: string | null;
};

/** proyecto + objetivo activo (el mas reciente) + fundamento (pagina cuyo
 * contenido empieza por 'Fundamento - '); cada pieza es opcional */
export async function contextoRecado(
  supabase: Supabase,
  tarea: Tarea
): Promise<ContextoRecado> {
  if (!tarea.proyectoId) {
    return { proyecto: null, objetivo: null, fundamento: null };
  }
  const idProyecto = tarea.proyectoId;

  const [rProyecto, rObjetivo, rFundamento] = await Promise.all([
    supabase.from('proyectos').select(COLS_PROYECTO).eq('id', idProyecto).maybeSingle(),
    supabase
      .from('objetivos')
      .select('titulo')
      .eq('proyecto_id', idProyecto)
      .eq('estado', 'activo')
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('ideas')
      .select('contenido')
      .eq('proyecto_id', idProyecto)
      .eq('archivada', false)
      .ilike('contenido', `${PREFIJO_FUNDAMENTO}%`)
      .limit(1)
  ]);
  if (rProyecto.error) throw rProyecto.error;
  if (rObjetivo.error) throw rObjetivo.error;
  if (rFundamento.error) throw rFundamento.error;

  const fila = rProyecto.data as FilaProyecto | null;
  return {
    proyecto: fila ? proyectoDe(fila) : null,
    objetivo: texto(rObjetivo.data?.[0]?.titulo),
    fundamento: texto(rFundamento.data?.[0]?.contenido)
  };
}

type FilaProyecto = Record<string, unknown>;

function proyectoDe(fila: FilaProyecto | null): ContextoRecado['proyecto'] {
  const nombre = texto(fila?.nombre);
  if (!nombre) return null;
  return {
    nombre,
    color:
      typeof fila?.color === 'string' && fila.color !== ''
        ? fila.color
        : COLOR_PROYECTO_DEFAULT
  };
}

function texto(valor: unknown): string | null {
  return typeof valor === 'string' && valor.trim() !== '' ? valor.trim() : null;
}
