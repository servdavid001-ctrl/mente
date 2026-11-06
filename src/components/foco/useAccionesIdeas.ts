'use client';

import { crearSubpagina, moverIdeaAPagina } from '@/lib/foco';

/** acciones de ideas del proyecto (modulos 12 y 13): crear la idea raiz ya
 * dentro del proyecto (POST con proyecto+estado), crear subpaginas (POST con
 * destino { parent_id }) y mover paginas (PUT parent_id). Recarga el detalle. */
export function useAccionesIdeas(proyectoId: string, recargar: () => Promise<void>) {
  async function crearIdea(texto: string, estado: 'proyecto' | 'investigacion'): Promise<void> {
    const res = await fetch('/api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'texto',
        text: texto,
        destino: { proyecto_id: proyectoId },
        estado
      })
    });
    if (!res.ok) throw new Error(`No pudimos guardar (${String(res.status)}).`);
    await recargar();
  }

  async function crearSubpaginaEn(
    texto: string,
    estado: 'proyecto' | 'investigacion',
    parentId: string
  ): Promise<void> {
    await crearSubpagina(parentId, texto, estado);
    await recargar();
  }

  async function moverIdea(ideaId: string, parentId: string | null): Promise<void> {
    await moverIdeaAPagina(ideaId, parentId);
    await recargar();
  }

  return { crearIdea, crearSubpaginaEn, moverIdea };
}
