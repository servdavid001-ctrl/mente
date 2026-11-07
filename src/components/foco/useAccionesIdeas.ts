'use client';

import { guardarCuerpoPagina, crearIdeaProyecto, crearSubpagina, listarHijos, moverIdeaAPagina } from '@/lib/foco';
import { componerTexto } from '@/lib/cuerpoPagina';
import type { Idea } from '@/lib/types';

/** acciones de ideas del proyecto (modulos 12 y 13): crear la idea raiz ya
 * dentro del proyecto (POST con proyecto+estado), crear subpaginas (POST con
 * destino { parent_id }) y mover paginas (PUT parent_id).
 * Fix P1 2026-11-07: tras guardar OK la idea confirmada por el server entra al
 * arbol al instante (agregarIdea) y el subarbol de la pagina se refresca con
 * GET /api/ideas?parent garantizado; el recargue global del detalle corre en
 * fondo sin bloquear ni desmontar la vista. Si el POST falla, la accion lanza:
 * el composer del caller mantiene el texto y muestra el error con reintento. */

type Detalle = {
  cargar: (enFondo?: boolean) => Promise<void>;
  agregarIdea: (idea: Idea) => void;
  sincronizarHijosPagina: (parentId: string, hijos: Idea[]) => void;
  moverIdeaLocal: (ideaId: string, parentId: string | null) => void;
  actualizarCuerpoIdea: (ideaId: string, texto: string) => void;
  avisar: (mensaje: string) => void;
};

export function useAccionesIdeas(proyectoId: string, detalle: Detalle) {
  async function crearIdea(texto: string, estado: 'proyecto' | 'investigacion'): Promise<void> {
    const idea = await crearIdeaProyecto(proyectoId, texto, estado);
    detalle.agregarIdea(idea); // visible al instante en su listado (sin mock)
    void detalle.cargar(true); // sync global de conteos en fondo
  }

  async function crearSubpaginaEn(
    texto: string,
    estado: 'proyecto' | 'investigacion',
    parentId: string
  ): Promise<void> {
    const idea = await crearSubpagina(parentId, texto, estado);
    detalle.agregarIdea(idea); // visible al instante (lista + badge del padre)
    try {
      // refresh garantizado del subarbol (GET /api/ideas?parent, especifico m13)
      detalle.sincronizarHijosPagina(parentId, await listarHijos(parentId));
    } catch {
      // la idea ya esta guardada y visible; avisamos sin bloquear el guardado
      detalle.avisar('La subpagina esta guardada pero no pudimos refrescar la lista.');
    }
    void detalle.cargar(true); // sync global de conteos en fondo
  }

  async function moverIdea(ideaId: string, parentId: string | null): Promise<void> {
    await moverIdeaAPagina(ideaId, parentId); // PUT validado en server (prof/ciclo)
    detalle.moverIdeaLocal(ideaId, parentId); // arbol local al instante
    void detalle.cargar(true); // sync global en fondo
  }

  /** modulo 14: guarda el cuerpo editable de la pagina (PUT contenido). Recompone
   * el texto completo preservando la primera linea (titulo, Regla 4 de la spec)
   * y el texto confirmado por el server (cap 2000) entra al arbol al instante */
  async function guardarCuerpo(ideaId: string, textoOriginal: string, cuerpo: string): Promise<void> {
    const idea = await guardarCuerpoPagina(ideaId, componerTexto(textoOriginal, cuerpo));
    detalle.actualizarCuerpoIdea(idea.id, idea.text);
  }

  return { crearIdea, crearSubpaginaEn, moverIdea, guardarCuerpo };
}
