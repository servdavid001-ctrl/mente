import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { esUuid } from '@/lib/foco';
import { extraerPasosTexto } from '@/lib/tareas';
import { existePropio, insertarTareas, type FilaTareaNueva } from '@/lib/tareasServer';

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/objetivos/[id]/tareas
 * Convierte los pasos del plan (lineas de `descripcion`) en tareas del
 * objetivo, heredando su proyecto.
 */
export async function POST(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    if (!esUuid(id)) return NextResponse.json({ error: 'Objetivo no encontrado' }, { status: 404 });

    const { data: fila, error } = await supabase
      .from('objetivos')
      .select('id,proyecto_id,descripcion')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!fila) return NextResponse.json({ error: 'Objetivo no encontrado' }, { status: 404 });

    const pasos = extraerPasosTexto(fila.descripcion);
    if (pasos.length === 0) {
      return NextResponse.json(
        { error: 'Este objetivo no tiene pasos accionables' },
        { status: 422 }
      );
    }

    // hereda el proyecto solo si sigue siendo visible para el usuario
    let proyectoId: string | null = fila.proyecto_id ?? null;
    if (proyectoId && !(await existePropio(supabase, 'proyectos', proyectoId))) {
      proyectoId = null;
    }

    const filas: FilaTareaNueva[] = pasos.map((titulo, indice) => ({
      titulo,
      nota: null,
      proyecto_id: proyectoId,
      objetivo_id: String(fila.id),
      idea_id: null,
      fecha: null,
      orden: indice
    }));

    const tareas = await insertarTareas(supabase, user.id, filas);
    return NextResponse.json({ tareas, creadas: tareas.length }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
