import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  esUuid,
  mapObjetivoRow,
  validarObjetivoNuevo,
  type ObjetivoRow
} from '@/lib/foco';
import { COLS_OBJETIVO, leerJson } from '@/lib/focoServer';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const proyectoId = new URL(request.url).searchParams.get('proyecto_id');
    if (proyectoId !== null && !esUuid(proyectoId)) {
      return NextResponse.json({ error: 'Proyecto invalido' }, { status: 400 });
    }

    const query = supabase
      .from('objetivos')
      .select(COLS_OBJETIVO)
      .order('created_at', { ascending: false });
    if (proyectoId) query.eq('proyecto_id', proyectoId);

    const { data, error } = await query;
    if (error) throw error;

    const objetivos = ((data ?? []) as ObjetivoRow[]).map(mapObjetivoRow);
    return NextResponse.json({ objetivos });
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

    const datos = validarObjetivoNuevo(await leerJson(request));
    if (datos === null) {
      return NextResponse.json({ error: 'Datos del objetivo invalidos' }, { status: 400 });
    }

    if (datos.proyecto_id !== null) {
      const { data: proyecto, error } = await supabase
        .from('proyectos')
        .select('id')
        .eq('id', datos.proyecto_id)
        .maybeSingle();
      if (error) throw error;
      if (!proyecto) {
        return NextResponse.json({ error: 'Proyecto invalido' }, { status: 400 });
      }
    }

    const { data, error } = await supabase
      .from('objetivos')
      .insert({
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        proyecto_id: datos.proyecto_id,
        fecha: datos.fecha
      })
      .select(COLS_OBJETIVO)
      .single();
    if (error) throw error;

    return NextResponse.json({ objetivo: mapObjetivoRow(data) }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
