/** glue cliente de las API externa (modulo 10): helpers de la busqueda, el
 * aceptar (envia las fichas seleccionadas) y el descartar. Nunca muta la idea
 * por su cuenta: el servidor decide al aceptar (spec: nada automatico). */

import { validarItemsExterna } from '@/lib/externas';
import type { ItemExterno } from '@/lib/types';

export type ExternaActiva = { id: string; items: ItemExterno[] };

export type PedidoBusqueda =
  | { ok: true; sugerencia: ExternaActiva }
  | { ok: false; estado: 'error' | 'vacio' | 'rate'; mensaje: string };

const ERROR_PEDIDO = 'No pudimos buscar conexiones externas. Reintentar';
const SIN_DATOS = 'No encontramos conexiones externas para esta idea.';

export async function buscarExternasPlan(ideaId: string): Promise<PedidoBusqueda> {
  try {
    const res = await fetch(`/api/ai/externa/${ideaId}`, { method: 'POST' });
    if (res.status === 429) {
      return {
        ok: false,
        estado: 'rate',
        mensaje: 'Has usado tu analisis de hoy. Vuelve manana — tus ideas siguen intactas.'
      };
    }
    const json = (await res.json().catch(() => null)) as null | {
      error?: unknown;
      sugerencia?: { id?: unknown; payload?: { items?: unknown } };
    };
    const payload = json?.sugerencia?.payload;
    const brutos = payload?.items;
    const items = Array.isArray(brutos) ? validarItemsExterna(brutos) : [];
    if (!res.ok) {
      if (res.status === 422) return { ok: false, estado: 'vacio', mensaje: SIN_DATOS };
      return { ok: false, estado: 'error', mensaje: textoError(json?.error, ERROR_PEDIDO) };
    }
    if (typeof json?.sugerencia?.id !== 'string' || items.length === 0) {
      return { ok: false, estado: 'vacio', mensaje: SIN_DATOS };
    }
    return { ok: true, sugerencia: { id: json.sugerencia.id, items } };
  } catch {
    return { ok: false, estado: 'error', mensaje: ERROR_PEDIDO };
  }
}

export async function aceptarExternas(
  sugerenciaId: string,
  seleccionadas: ItemExterno[]
): Promise<boolean> {
  try {
    const res = await fetch(`/api/ai/sugerencias/${sugerenciaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'aceptar', items: seleccionadas })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function descartarExternas(sugerenciaId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/ai/sugerencias/${sugerenciaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'descartar' })
    });
    return res.ok;
  } catch {
    return false;
  }
}

function textoError(bruto: unknown, fallback: string): string {
  return typeof bruto === 'string' && bruto !== '' ? bruto : fallback;
}
