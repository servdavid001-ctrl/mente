/** glue cliente de las API AI (modulo 3): mini wrappers con manejo de error
 * por estado vacio; la Bandeja y el Detalle comparten estas llamadas. */

export type EstadoPedido = 'quieto' | 'loading' | 'error' | 'rate' | 'indisponible';

export async function pedirSugerencia(ideaId: string): Promise<EstadoPedido> {
  try {
    const res = await fetch(`/api/ai/analizar/${ideaId}`, { method: 'POST' });
    if (res.status === 429) return 'rate';
    if (res.status === 503) return 'indisponible';
    if (!res.ok) return 'error';
    return 'quieto';
  } catch {
    return 'error';
  }
}

export async function cambiarSugerencia(sugerenciaId: string, accion: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/ai/sugerencias/${sugerenciaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export type SugerenciaBruta = {
  id: string;
  ideaId: string;
  tipo: string;
  payload: Record<string, unknown>;
  estado: string;
};

export async function cargarSugerencias(idsDeIdeas: string[]): Promise<SugerenciaBruta[]> {
  if (idsDeIdeas.length === 0) return [];
  try {
    const res = await fetch(`/api/ai/sugerencias?idea_ids=${idsDeIdeas.join(',')}`);
    if (!res.ok) return [];
    const json = (await res.json()) as { sugerencias?: SugerenciaBruta[] };
    return json.sugerencias ?? [];
  } catch {
    return [];
  }
}
