/** modulo 5: tipos y fetch helpers cliente para tokens de captura */

export type TokenCaptura = {
  id: string;
  nombre: string;
  created_at: string;
  last_used_at: string | null;
};

async function pedir<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', ...init });
  if (!res.ok) {
    let mensaje = 'Error';
    try {
      const json = (await res.json()) as { error?: string };
      if (json.error) mensaje = json.error;
    } catch {
      /* respuesta sin json: mensaje generico */
    }
    throw new Error(mensaje);
  }
  return (await res.json()) as T;
}

export async function listarTokensCaptura(): Promise<TokenCaptura[]> {
  const res = await pedir<{ tokens: TokenCaptura[] }>('/api/captura/token');
  return res.tokens;
}

export function crearTokenCaptura(): Promise<{ id: string; token: string }> {
  return pedir<{ id: string; token: string }>('/api/captura/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
}

export async function revocarTokenCaptura(id: string): Promise<void> {
  await pedir<{ ok: boolean }>(`/api/captura/token?id=${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
}

/** fecha corta y legible para la lista de tokens */
export function fechaCorta(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return 'Sin fecha';
  return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}
