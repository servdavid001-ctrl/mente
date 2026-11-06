'use client';

/** acciones de ideas del proyecto (modulo 12): composer directo que crea la
 * idea ya dentro del proyecto (POST /api/ideas con destino+estado) y recarga
 * el detalle. El proyecto nunca trae ideas desde la Bandeja. */
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

  return { crearIdea };
}
