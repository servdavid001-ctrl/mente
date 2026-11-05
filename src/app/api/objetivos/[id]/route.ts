import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  esUuid,
  mapObjetivoRow,
  validarCambiosObjetivo,
  type ObjetivoRow
} from '@/lib/foco';
import { COLS_OBJETIVO, leerJson } from '@/lib/focoServer';

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    if (!esUuid(id)) return NextResponse.json({ error: 'Objetivo no encontrado' }, { status: 404 });

    const cambios = validarCambiosObjetivo(await leerJson(request));
    if (cambios === null) {
      return NextResponse.json({ error: 'Datos del objetivo invalidos' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('objetivos')
      .update(cambios)
      .eq('id', id)
      .select(COLS_OBJETIVO)
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Objetivo no encontrado' }, { status: 404 });

    return NextResponse.json({ objetivo: mapObjetivoRow(data as ObjetivoRow) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    if (!esUuid(id)) return NextResponse.json({ error: 'Objetivo no encontrado' }, { status: 404 });

    const { data, error } = await supabase
      .from('objetivos')
      .delete()
      .eq('id', id)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Objetivo no encontrado' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
