/** modulo 15: tipos y fetch helpers cliente de los tokens de agentes */

export type TokenAgente = {
  id: string;
  nombre: string;
  created_at: string;
  last_used_at: string | null;
  revocado_en: string | null;
  permisos: string[] | null;
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

export async function listarTokensAgente(): Promise<TokenAgente[]> {
  const res = await pedir<{ tokens: TokenAgente[] }>('/api/ajustes/tokens');
  return res.tokens;
}

export function crearTokenAgente(nombre: string): Promise<{ id: string; token: string }> {
  return pedir<{ id: string; token: string }>('/api/ajustes/tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre })
  });
}

export function revocarTokenAgente(id: string): Promise<void> {
  return pedir<{ ok: boolean }>(
    `/api/ajustes/tokens?id=${encodeURIComponent(id)}`,
    { method: 'DELETE' }
  ).then(() => undefined);
}

/** modulo 19: guarda los permisos del conector (PUT owner only) */
export function guardarPermisosToken(id: string, permisos: string[]): Promise<string[]> {
  return pedir<{ ok: boolean; permisos: string[] }>('/api/ajustes/tokens', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, permisos })
  }).then((res) => res.permisos);
}
