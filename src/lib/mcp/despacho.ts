import type { CtxMcp, SalidaTool } from './comun';
import { toolBuscarTareas } from './tareas';
import { toolObtenerPlan } from './plan';
import { toolLeerInvestigacion } from './investigacion';
import { toolCrearNota, toolCrearSubpagina } from './nota';
import { toolCrearTarea } from './tarea';
import { toolTerminarTarea } from './hecha';
import { toolImportarInvestigacion } from './importar';
import { toolPedirAnexo } from './anexo';

/** mapa de tools del MCP (v1 lectura + creacion + terminar_tarea) y resumen
 * corto para el log: solo meta, nunca contenido (sin texto ni titulos). */

export type ManejadorTool = (ctx: CtxMcp, args: unknown) => Promise<SalidaTool>;

export const MANEJADORES: Record<string, ManejadorTool> = {
  buscar_tareas: toolBuscarTareas,
  obtener_plan: toolObtenerPlan,
  leer_investigacion: toolLeerInvestigacion,
  crear_nota: toolCrearNota,
  crear_subpagina: toolCrearSubpagina,
  crear_tarea: toolCrearTarea,
  terminar_tarea: toolTerminarTarea,
  importar_investigacion: toolImportarInvestigacion,
  pedir_anexo: toolPedirAnexo
};

type DatosTool = Record<string, unknown>;

export function resumenAccion(
  nombre: string,
  exito: boolean,
  datos: unknown,
  mensajeFallo: string | null
): { proyecto: string | null; resumen: string } {
  if (!exito || mensajeFallo !== null) {
    return { proyecto: null, resumen: (mensajeFallo ?? 'fallo').slice(0, 200) };
  }
  const d = datos as DatosTool | null;
  const lista = cantidadDe(d, ['tareas', 'plan', 'investigaciones']);
  const genericos: Record<string, string> = {
    buscar_tareas: `tareas entregadas: ${lista}`,
    obtener_plan: `plan entregado: ${cantidadDe(d, ['plan'])} paginas`,
    leer_investigacion: `investigaciones entregadas: ${lista}`,
    crear_nota: `nota creada (${d?.caracteres} chars)`,
    crear_subpagina: `subpagina creada (${d?.caracteres} chars)`,
    crear_tarea: `tarea creada: ${d?.asignado_a}`,
    terminar_tarea: `tarea terminada${d?.nota_id ? ' + nota de resultado' : ''}`,
    importar_investigacion: `investigacion importada con ${d?.subpaginas} subpaginas`,
    pedir_anexo: `peticion de anexo en ${d?.proyecto ?? 'bandeja'}`
  };
  return {
    proyecto: typeof d?.proyecto === 'string' ? d.proyecto : null,
    resumen: (genericos[nombre] ?? 'ok').slice(0, 200)
  };
}

function cantidadDe(d: unknown, claves: string[]): number {
  if (typeof d !== 'object' || d === null) return 0;
  const rec = d as DatosTool;
  for (const clave of claves) {
    const valor = rec[clave];
    if (Array.isArray(valor)) return valor.length;
  }
  return 0;
}
