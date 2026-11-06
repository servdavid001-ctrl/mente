/* modulo 9: higiene asistida (FOUNDATION punto 11). El sistema SOLO SUGIERE:
 * el GET /api/higiene es una consulta de solo lectura y toda accion es un clic
 * explicito del usuario. Umbrales fijos, sin configuracion extra en v1. */

/** dias sin cambios para sugerir revision (umbral de la spec, no editable en v1) */
export const DIAS_UMBRAL = 14;

/** maximo de recomendaciones por tipo (cap de la spec) */
export const CAP_RECOMENDACIONES = 20;

export type RecomendacionTipo =
  | 'idea_bandeja'
  | 'idea_biblioteca_apartada'
  | 'tarea_vieja'
  | 'coleccion_vacia';

export type Recomendacion = {
  tipo: RecomendacionTipo;
  id: string; // id de la entidad correspondiente (no composita)
  titulo: string; // idea.contenido (o titulo_pagina, o tareas.titulo, o colecciones.nombre)
  detalle: string; // ej: "14 dias sin cambios"
  dias: number; // dias sin updated_at
};

export type RespHigiene = {
  recomendaciones: Recomendacion[];
};

/** dias completos desde una fecha ISO hasta `ahora` (epoch ms) */
export function diasDesde(fechaISO: string, ahora: number): number {
  const t = Date.parse(fechaISO);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((ahora - t) / 86_400_000));
}

export function detalleDias(dias: number): string {
  return `${dias} dias sin cambios`;
}

/** fila lista para devolver en el JSON del GET */
export function nuevaRecomendacion(
  tipo: RecomendacionTipo,
  id: string,
  titulo: string,
  fecha: string,
  ahora: number
): Recomendacion {
  const dias = diasDesde(fecha, ahora);
  return { tipo, id, titulo, detalle: detalleDias(dias), dias };
}

/** titulo de una idea: contenido o titulo_pagina; la voz sin texto usa fallback */
export function tituloIdea(fila: {
  contenido: string | null;
  titulo_pagina: string | null;
}): string {
  if (fila.contenido) return fila.contenido;
  if (fila.titulo_pagina) return fila.titulo_pagina;
  return 'Nota de voz';
}
