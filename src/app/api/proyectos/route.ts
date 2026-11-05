import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  contarIdeas,
  contarObjetivosActivos,
  mapProyectoRow,
  validarProyectoNuevo,
  type IdeaConteoRow,
  type ObjetivoConteoRow,
  type ProyectoRow
} from '@/lib/foco';
import { COLS_PROYECTO, leerJson } from '@/lib/focoServer';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { data: filas, error } = await supabase
      .from('proyectos')
      .select(COLS_PROYECTO)
      .order('orden', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;

    const [rIdeas, rObjetivos] = await Promise.all([
      supabase.from('ideas').select('proyecto_id,archivada'),
      supabase.from('objetivos').select('proyecto_id,estado')
    ]);
    if (rIdeas.error) throw rIdeas.error;
    if (rObjetivos.error) throw rObjetivos.error;

    const { porProyecto, sinProyecto } = contarIdeas(
      (rIdeas.data ?? []) as IdeaConteoRow[]
    );
    const activos = contarObjetivosActivos((rObjetivos.data ?? []) as ObjetivoConteoRow[]);

    const proyectos = ((filas ?? []) as ProyectoRow[]).map((row) =>
      mapProyectoRow(row, {
        ideas: porProyecto[String(row.id)] ?? 0,
        objetivosActivos: activos[String(row.id)] ?? 0
      })
    );

    return NextResponse.json({ proyectos, sinProyecto });
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

    const datos = validarProyectoNuevo(await leerJson(request));
    if (datos === null) {
      return NextResponse.json({ error: 'Datos del proyecto invalidos' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('proyectos')
      .insert({
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        color: datos.color
      })
      .select(COLS_PROYECTO)
      .single();
    if (error) throw error;

    return NextResponse.json(
      { proyecto: mapProyectoRow(data, { ideas: 0, objetivosActivos: 0 }) },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
