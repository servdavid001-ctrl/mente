import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { mapColeccionRow } from '@/lib/biblioteca';
type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = await request.json();
    const cambios = buildUpdateRow(body);
    if (cambios === null) {
      return NextResponse.json({ error: 'Datos de la coleccion invalidos' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('colecciones')
      .update(cambios)
      .eq('id', id)
      .select('id,nombre,color')
      .single();
    if (error) {
      if ('code' in error && error.code === '23505') {
        return NextResponse.json({ error: 'Esa coleccion ya existe' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ coleccion: mapColeccionRow(data) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE borra la coleccion y la extrae de coleccion_ids de todas las ideas */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    // liberar las ideas de la coleccion antes de borrarla (array sin FK)
    let desde = 0;
    for (;;) {
      const { data: filas, error } = await supabase
        .from('ideas')
        .select('id,coleccion_ids')
        .contains('coleccion_ids', [id])
        .range(desde, desde + 99);
      if (error) throw error;
      if (!filas || filas.length === 0) break;
      for (const fila of filas as { id: string; coleccion_ids: string[] }[]) {
        const restantes = (fila.coleccion_ids ?? []).filter((cid) => cid !== id);
        const { error: errUp } = await supabase
          .from('ideas')
          .update({ coleccion_ids: restantes })
          .eq('id', fila.id);
        if (errUp) throw errUp;
      }
      if (filas.length < 100) break;
      desde += 100;
    }

    const { error: errDel } = await supabase
      .from('colecciones')
      .delete()
      .eq('id', id);
    if (errDel) throw errDel;

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildUpdateRow(body: unknown): Record<string, unknown> | null {
  if (typeof body !== 'object' || body === null) return null;
  const { nombre, color } = (body ?? {}) as Record<string, unknown>;
  const cambios: Record<string, unknown> = {};
  if (nombre === undefined && color === undefined) return null;
  if (nombre !== undefined) {
    if (typeof nombre !== 'string') return null;
    const n = nombre.trim();
    if (n.length === 0 || n.length > 80) return null;
    cambios.nombre = n;
  }
  if (color !== undefined) {
    if (color === null) {
      cambios.color = null;
    } else if (typeof color === 'string' && color.length === 7 && /^#[0-9A-Fa-f]{6}$/.test(color)) {
      cambios.color = color;
    } else {
      return null;
    }
  }
  return cambios;
}
