import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { mapColeccionRow } from '@/lib/biblioteca';
import type { Coleccion } from '@/lib/types';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { data, error } = await supabase
      .from('colecciones')
      .select('id,nombre,color')
      .order('created_at');
    if (error) throw error;

    const colecciones: Coleccion[] = (data ?? []).map(mapColeccionRow);
    return NextResponse.json({ colecciones });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = await request.json();
    const row = buildInsertRow(body);
    if (row === null) {
      return NextResponse.json({ error: 'Datos de la coleccion invalidos' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('colecciones')
      .insert(row)
      .select('id,nombre,color')
      .single();
    if (error) {
      // UNIQUE (user_id, nombre): la UI espera el aviso duplicado
      if ('code' in error && error.code === '23505') {
        return NextResponse.json({ error: 'Esa coleccion ya existe' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ coleccion: mapColeccionRow(data) }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildInsertRow(body: unknown): Record<string, unknown> | null {
  if (typeof body !== 'object' || body === null) return null;
  const { nombre, color } = (body ?? {}) as Record<string, unknown>;
  if (typeof nombre !== 'string') return null;
  const n = nombre.trim();
  if (n.length === 0 || n.length > 80) return null;
  return { nombre: n, color: typeof color === 'string' && color.length === 7 ? color : null };
}
