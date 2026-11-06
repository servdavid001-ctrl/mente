import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { validarClave, type ProveedorIa } from '@/lib/ai/provider';
import {
  borrarCredencial,
  estadoCredencial,
  guardarCredencial,
  type EstadoCredencial
} from '@/lib/ai/credenciales';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET/PUT/DELETE /api/ajustes/ai (modulo 8): estado y gestion de la clave AI
 * del usuario. La clave se valida contra el proveedor, se cifra en el servidor
 * y nunca se devuelve al cliente (solo proveedor + last4).
 */

const PROVEEDORES: ProveedorIa[] = ['openrouter', 'openai'];
const MAX_INTENTOS = 10;
const VENTANA_MS = 60 * 60 * 1000;
const MAX_USUARIOS = 5000;

type Entrada = { intentos: number; expira: number };
const intentosPorUsuario = new Map<string, Entrada>();

function limpiar(ahora: number) {
  for (const [clave, entrada] of intentosPorUsuario) {
    if (entrada.expira <= ahora) intentosPorUsuario.delete(clave);
  }
  let sobrantes = intentosPorUsuario.size - MAX_USUARIOS;
  for (const clave of intentosPorUsuario.keys()) {
    if (sobrantes <= 0) break;
    intentosPorUsuario.delete(clave);
    sobrantes -= 1;
  }
}

function permitirIntento(userId: string): boolean {
  const ahora = Date.now();
  if (intentosPorUsuario.size >= MAX_USUARIOS) limpiar(ahora);
  const entrada = intentosPorUsuario.get(userId);
  if (!entrada || entrada.expira <= ahora) {
    intentosPorUsuario.set(userId, { intentos: 1, expira: ahora + VENTANA_MS });
    return true;
  }
  if (entrada.intentos >= MAX_INTENTOS) return false;
  entrada.intentos += 1;
  return true;
}

function esProveedor(valor: unknown): valor is ProveedorIa {
  return typeof valor === 'string' && (PROVEEDORES as string[]).includes(valor);
}

function esClaveValida(valor: unknown): valor is string {
  if (typeof valor !== 'string') return false;
  const clave = valor.trim();
  return clave.length >= 20 && clave.length <= 200 && /^sk-[A-Za-z0-9_-]+$/.test(clave);
}

/** errores sin detalle interno: la clave nunca aparece en la respuesta */
/** datos por usuario: nunca cachear en CDN ni en navegador */
const SIN_CACHE = { 'Cache-Control': 'private, no-store, max-age=0' };

function estadoResponse(estado: EstadoCredencial) {
  return NextResponse.json(estado, { headers: SIN_CACHE });
}

function respuestaError(error: unknown) {
  const mensaje = error instanceof Error ? error.message : 'Error';
  if (mensaje === 'AI_KEY_SECRET no configurado') {
    return NextResponse.json(
      { error: 'Falta AI_KEY_SECRET en el servidor.' },
      { status: 500 }
    );
  }
  return NextResponse.json(
    { error: 'No se pudo completar la operacion.' },
    { status: 500 }
  );
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    return estadoResponse(await estadoCredencial(user.id));
  } catch (error: unknown) {
    return respuestaError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    if (!permitirIntento(user.id)) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Espera un poco.' },
        { status: 429 }
      );
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const proveedor = body?.proveedor;
    const apiKey = typeof body?.apiKey === 'string' ? body.apiKey.trim() : '';
    if (!esProveedor(proveedor) || !esClaveValida(apiKey)) {
      return NextResponse.json({ error: 'Clave invalida' }, { status: 400 });
    }

    const validacion = await validarClave(proveedor, apiKey);
    if (!validacion.ok) {
      if (validacion.motivo === 'invalida') {
        return NextResponse.json(
          { error: 'La clave no es valida para ese proveedor.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'No pudimos validar la clave ahora. Reintenta.' },
        { status: 502 }
      );
    }

    await guardarCredencial(user.id, proveedor, apiKey);
    return estadoResponse(await estadoCredencial(user.id));
  } catch (error: unknown) {
    return respuestaError(error);
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    await borrarCredencial(user.id);
    return estadoResponse(await estadoCredencial(user.id));
  } catch (error: unknown) {
    return respuestaError(error);
  }
}
