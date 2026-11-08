/** rate limit in-memory para rutas publicas (patron /api/ajustes/ai):
 * Map de clave -> intentos en una ventana; se limpia al llenarse. */

type Entrada = { intentos: number; expira: number };

export type Limitador = {
  /** true = puede pasar; false = 429 */
  permitir: (clave: string) => boolean;
};

const MAX_CLAVES = 5000;

function limpiar(mapa: Map<string, Entrada>, ahora: number) {
  for (const [clave, entrada] of mapa) {
    if (entrada.expira <= ahora) mapa.delete(clave);
  }
  let sobrantes = mapa.size - MAX_CLAVES;
  for (const clave of mapa.keys()) {
    if (sobrantes <= 0) break;
    mapa.delete(clave);
    sobrantes -= 1;
  }
}

export function crearLimitador(maxIntentos: number, ventanaMs: number): Limitador {
  const mapa = new Map<string, Entrada>();
  return {
    permitir(clave: string): boolean {
      const ahora = Date.now();
      if (mapa.size >= MAX_CLAVES) limpiar(mapa, ahora);
      const entrada = mapa.get(clave);
      if (!entrada || entrada.expira <= ahora) {
        mapa.set(clave, { intentos: 1, expira: ahora + ventanaMs });
        return true;
      }
      if (entrada.intentos >= maxIntentos) return false;
      entrada.intentos += 1;
      return true;
    }
  };
}

/** clave del limitador para rutas publicas (ip del proxy o 'anon') */
export function claveIp(request: Request): string {
  const proxy = request.headers.get('x-forwarded-for');
  if (typeof proxy === 'string') {
    const primera = proxy.split(',')[0]?.trim();
    if (primera) return primera;
  }
  return 'anon';
}
