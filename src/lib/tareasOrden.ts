import type { Tarea } from './types';

/* paso 4 (subtareas): orden estable del listado. Display cliente = orden asc
 * con desempate createdAt; al reordenar se renumera el grupo (indice = orden)
 * para que el server (.order orden) devuelva el mismo orden que pinta el
 * cliente. Con el grupo legado en 0, el desempate createdAt decide. */

export function compararOrden(a: Tarea, b: Tarea): number {
  if (a.orden !== b.orden) return a.orden - b.orden;
  return a.createdAt.localeCompare(b.createdAt);
}

/** grupo (raices o subtareas de un mismo padre) en display order */
export function grupoDe(tareas: Tarea[], parentId: string | null): Tarea[] {
  return tareas.filter((t) => (t.parentId ?? null) === parentId).sort(compararOrden);
}

/** subtareas por id de tarea raiz, cada lista en display order */
export function mapaPorPadre(tareas: Tarea[]): Record<string, Tarea[]> {
  const porPadre: Record<string, Tarea[]> = {};
  for (const tarea of tareas) {
    if (!tarea.parentId) continue;
    (porPadre[tarea.parentId] ??= []).push(tarea);
  }
  for (const lista of Object.values(porPadre)) lista.sort(compararOrden);
  return porPadre;
}

/** orden para una tarea nueva: si el grupo ya esta renumerado va al final
 * (max + 1); con el grupo legado en 0 entra en 0 y el desempate createdAt
 * la deja ultima */
export function nuevoOrden(grupo: Tarea[]): number {
  const max = grupo.reduce((m, t) => Math.max(m, t.orden), 0);
  return max === 0 ? 0 : max + 1;
}

/* tras un swap, las tareas cuyo orden cambio con su nueva posicion */
export function renumerar(grupo: Tarea[]): Array<{ id: string; orden: number }> {
  return grupo
    .map((t, i) => ({ id: t.id, orden: i, previa: t.orden }))
    .filter((t) => t.orden !== t.previa)
    .map(({ id, orden }) => ({ id, orden }));
}
