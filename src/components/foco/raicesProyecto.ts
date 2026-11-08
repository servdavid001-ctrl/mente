import type { Idea } from '@/lib/types';

/* paso 4: raices del proyecto por tipo (modulo 13: solo ideas sin parentId;
 * las subpaginas viven colgadas de su padre). Calculo puro memoizado por el
 * caller. */
export function raicesPorEstado(ideas: Idea[]) {
  const notas = ideas.filter((i) => i.estado === 'proyecto' && !i.parentId);
  const investigaciones = ideas.filter((i) => i.estado === 'investigacion' && !i.parentId);
  return { notas, investigaciones };
}
