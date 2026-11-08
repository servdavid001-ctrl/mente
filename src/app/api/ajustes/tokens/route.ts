import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { esUuid } from '@/lib/foco';
import { hashToken, leerJson } from '@/lib/captura';
import { NOMBRES_MCP } from '@/lib/mcp/tools';
import {
  generarTokenMt,
  validarNombreAgente
} from '@/lib/agentesServer';

/** tokens de acceso para agentes: crear una vez, listar, revocar (logico),
 * y modulo 19: PUT de permisos por tools (owner only, validacion estricta
 * contra el catalogo compartido). El token plano solo se devuelve en el
 * POST y jamas vuelve a verse. */

const COLS_TOKEN = 'id,nombre,created_at,last_used_at,revocado_en,permisos';

/** valida la lista de permisos: array de nombres del catalogo, sin duplicados;
 * null = invalido (array vacio es valido: bloquea TODO, advertido en UI) */
function validarPermisos(bruto: unknown): string[] | null {
  if (!Array.isArray(bruto)) return null;
  const vistos = new Set<string>();
  for (const item of bruto) {
    if (typeof item !== 'string' || !NOMBRES_MCP.includes(item) || vistos.has(item)) {
      return null;
    }
    vistos.add(item);
  }
  return NOMBRES_MCP.filter((nombre) => vistos.has(nombre));
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { data, error } = await supabase
      .from('worker_tokens')
      .select(COLS_TOKEN)
      .order('created_at', { ascending: false });
    if (error) throw error;

    return NextResponse.json({ tokens: data ?? [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const nombre = validarNombreAgente(await leerJson(request));
    if (nombre === null) {
      return NextResponse.json({ error: 'Nombre invalido' }, { status: 400 });
    }

    const token = generarTokenMt();
    const fila = { nombre, token_hash: hashToken(token) };
    const { data, error } = await supabase
      .from('worker_tokens')
      .insert(fila)
      .select('id')
      .single();
    if (error) throw error;

    return NextResponse.json({ id: data.id, token }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** modulo 19: PUT {id, permisos[]} — owner only (RLS user_id). Se rechazan
 * tokens inexistentes/revocados (404) y permisos fuera del catalogo (400). */
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = (await leerJson(request)) as { id?: unknown; permisos?: unknown } | null;
    const id = typeof body?.id === 'string' && esUuid(body.id) ? body.id : null;
    const permisos = validarPermisos(body?.permisos);
    if (!id || permisos === null) {
      return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('worker_tokens')
      .update({ permisos })
      .eq('id', id)
      .is('revocado_en', null)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Token no existe o ya revocado' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, permisos });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** revocacion logica (PUT interno de revocado_en = now); nada fisico */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const id = new URL(request.url).searchParams.get('id');
    if (!id || !esUuid(id)) {
      return NextResponse.json({ error: 'Token invalido' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('worker_tokens')
      .update({ revocado_en: new Date().toISOString() })
      .eq('id', id)
      .is('revocado_en', null)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Token no existe o ya revocado' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
