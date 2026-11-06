'use client';

/** acciones de ideas de la libreta dual (modulo 11): composer directo
 * (POST /api/ideas con destino+estado) y traer desde la Bandeja
 * (PUT /api/ideas/[id] con proyectoId+estado). Ambas recargan el detalle. */
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

  async function moverIdea(ideaId: string): Promise<void> {
    const res = await fetch(`/api/ideas/${ideaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proyectoId, estado: 'proyecto' })
    });
    if (!res.ok) throw new Error(`No pudimos mover la idea (${String(res.status)}).`);
    await recargar();
  }

  return { crearIdea, moverIdea };
}
