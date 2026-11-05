import { timingSafeEqual } from 'node:crypto';

/**
 * Registro por invitacion (single-user): el signup publico de Supabase sigue
 * cerrado; el usuario se crea desde el servidor con service role.
 *
 * Rate limit best-effort EN MEMORIA: el Map vive en el proceso/instancia.
 * En serverless cada instancia (y cada cold start) tiene su propio contador;
 * sirve como friccion, no como garantia distribuida.
 */
const MAX_INTENTOS = 5;
const VENTANA_MS = 60 * 60 * 1000;
const MAX_IPS = 5000;

type Entrada = { intentos: number; expira: number };
const intentosPorIp = new Map<string, Entrada>();

export function ipDe(request: Request): string {
  const reenviada = request.headers.get('x-forwarded-for');
  const primera = reenviada?.split(',')[0]?.trim();
  if (primera) return primera;
  return request.headers.get('x-real-ip')?.trim() || 'desconocida';
}

export function permitirIntento(ip: string): boolean {
  const ahora = Date.now();
  if (intentosPorIp.size >= MAX_IPS) limpiar(ahora);

  const entrada = intentosPorIp.get(ip);
  if (!entrada || entrada.expira <= ahora) {
    intentosPorIp.set(ip, { intentos: 1, expira: ahora + VENTANA_MS });
    return true;
  }
  if (entrada.intentos >= MAX_INTENTOS) return false;
  entrada.intentos += 1;
  return true;
}

function limpiar(ahora: number) {
  for (const [ip, entrada] of intentosPorIp) {
    if (entrada.expira <= ahora) intentosPorIp.delete(ip);
  }
  /* si sigue lleno, descarta las entradas mas antiguas (orden de insercion) */
  let sobrantes = intentosPorIp.size - MAX_IPS;
  for (const ip of intentosPorIp.keys()) {
    if (sobrantes <= 0) break;
    intentosPorIp.delete(ip);
    sobrantes -= 1;
  }
}

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizarEmail(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const email = valor.trim().toLowerCase();
  return RE_EMAIL.test(email) ? email : null;
}

export function passwordValida(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.length >= 12 && valor.length <= 72;
}

export function codigoCoincide(codigo: string, esperado: string): boolean {
  const recibido = Buffer.from(codigo, 'utf8');
  const correcto = Buffer.from(esperado, 'utf8');
  if (recibido.length !== correcto.length) return false;
  return timingSafeEqual(recibido, correcto);
}

export function esEmailExistente(error: { code?: string; message?: string }): boolean {
  const mensaje = (error.message ?? '').toLowerCase();
  return (
    error.code === 'email_exists' ||
    mensaje.includes('already been registered') ||
    mensaje.includes('already registered') ||
    mensaje.includes('already exists')
  );
}
