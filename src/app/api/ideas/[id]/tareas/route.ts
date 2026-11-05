import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { esUuid } from '@/lib/foco';
import { extraerPasosIdea, validarObjetivoOpcional } from '@/lib/tareas';
import {
  existePropio,
  insertarTareas,
  leerJsonTareas,
  type FilaTareaNueva
} from '@/lib/tareasServer';
import { mapIdeaRow, SELECT_IDEA } from '@/lib/ideas';

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/ideas/[id]/tareas
 * Convierte una idea en tareas. Pasos: minuta AI, o lineas/bullets de la
 * nota > contenido > transcripcion. Body opcional: { objetivo_id }.
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    if (!esUuid(id)) return NextResponse.json({ error: 'Idea no encontrada' }, { status: 404 });

    const datos = validarObjetivoOpcional(await leerJsonTareas(request));
    if (datos === null) {
      return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });
    }

    const { data: filaIdea, error } = await supabase
      .from('ideas')
      .select(SELECT_IDEA)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!filaIdea) return NextResponse.json({ error: 'Idea no encontrada' }, { status: 404 });

    if (datos.objetivo_id) {
      const existe = await existePropio(supabase, 'objetivos', datos.objetivo_id);
      if (!existe) return NextResponse.json({ error: 'Objetivo invalido' }, { status: 400 });
    }

    const idea = mapIdeaRow(filaIdea);
    const pasos = extraerPasosIdea(idea);
    if (pasos.length === 0) {
      return NextResponse.json(
        { error: 'Esta idea no tiene pasos accionables' },
        { status: 422 }
      );
    }

    // el proyecto de la idea debe seguir siendo visible para el usuario
    let proyectoId = idea.proyectoId ?? null;
    if (proyectoId && !(await existePropio(supabase, 'proyectos', proyectoId))) {
      proyectoId = null;
    }

    const filas: FilaTareaNueva[] = pasos.map((titulo, indice) => ({
      titulo,
      nota: null,
      proyecto_id: proyectoId,
      objetivo_id: datos.objetivo_id,
      idea_id: idea.id,
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
