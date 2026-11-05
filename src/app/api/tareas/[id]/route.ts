import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { esUuid } from '@/lib/foco';
import { mapTareaRow, validarCambiosTarea, type TareaRow } from '@/lib/tareas';
import {
  COLS_TAREA,
  leerJsonTareas,
  relacionInvalida
} from '@/lib/tareasServer';

type Params = { params: Promise<{ id: string }> };

const MENSAJE_RELACION: Record<string, string> = {
  proyectos: 'Proyecto invalido',
  objetivos: 'Objetivo invalido',
  ideas: 'Idea invalida'
};

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    if (!esUuid(id)) return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });

    const cambios = validarCambiosTarea(await leerJsonTareas(request));
    if (cambios === null) {
      return NextResponse.json({ error: 'Datos de la tarea invalidos' }, { status: 400 });
    }

    const invalida = await relacionInvalida(supabase, cambios);
    if (invalida) {
      return NextResponse.json({ error: MENSAJE_RELACION[invalida] }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tareas')
      .update(cambios)
      .eq('id', id)
      .select(COLS_TAREA)
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });

    return NextResponse.json({ tarea: mapTareaRow(data as TareaRow) });
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
    if (!esUuid(id)) return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });

    const { data, error } = await supabase.from('tareas').delete().eq('id', id).select('id');
    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
