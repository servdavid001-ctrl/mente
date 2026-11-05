import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  esUuid,
  mapProyectoRow,
  validarCambiosProyecto,
  type ProyectoRow
} from '@/lib/foco';
import {
  COLS_PROYECTO,
  cargarProyectoConDetalle,
  contarDeProyecto,
  leerJson
} from '@/lib/focoServer';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    if (!esUuid(id)) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

    const detalle = await cargarProyectoConDetalle(supabase, id);
    if (!detalle) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    return NextResponse.json(detalle);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    if (!esUuid(id)) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

    const cambios = validarCambiosProyecto(await leerJson(request));
    if (cambios === null) {
      return NextResponse.json({ error: 'Datos del proyecto invalidos' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('proyectos')
      .update(cambios)
      .eq('id', id)
      .select(COLS_PROYECTO)
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

    return NextResponse.json({
      proyecto: mapProyectoRow(data as ProyectoRow, await contarDeProyecto(supabase, id))
    });
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
    if (!esUuid(id)) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

    const { data, error } = await supabase
      .from('proyectos')
      .delete()
      .eq('id', id)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
