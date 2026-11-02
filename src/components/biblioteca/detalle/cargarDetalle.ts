import type { Coleccion, Conexion, Idea } from '@/lib/types';

/** idea sin el peso de la nota (los 'otros' del picker/index) */
export type Datos = Omit<Idea, 'nota'>;

/** carga del detalle: ideas de biblioteca + colecciones + conexiones del item */
export async function cargarDetalle(ideaId: string): Promise<{
  idea: Idea | null;
  otros: Datos[];
  colecciones: Coleccion[];
  conexiones: Conexion[];
}> {
  const [rIdeas, rCol, rCon] = await Promise.all([
    fetch('/api/ideas?estado=biblioteca&todas=1'),
    fetch('/api/colecciones'),
    fetch(`/api/conexiones?id=${ideaId}`)
  ]);

  const ideas: Idea[] = rIdeas.ok ? ((await rIdeas.json()) as { ideas: Idea[] }).ideas : [];
  const colecciones: Coleccion[] = rCol.ok
    ? ((await rCol.json()) as { colecciones: Coleccion[] }).colecciones
    : [];
  const conexiones: Conexion[] = rCon.ok
    ? ((await rCon.json()) as { conexiones: Conexion[] }).conexiones
    : [];

  return {
    idea: ideas.find((i) => i.id === ideaId) ?? null,
    otros: ideas.map(({ nota: _n, ...resto }) => resto),
    colecciones,
    conexiones
  };
}

/** tipos ya conectados (ambos sentidos) para el aviso de duplicado */
export function idsConectados(conexiones: Conexion[], itemId: string): string[] {
  return conexiones.map((c) => (c.desdeId === itemId ? c.haciaId : c.desdeId));
}
