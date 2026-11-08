import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { esUuid } from '@/lib/foco';
import {
  fechaHoyISO,
  mapTareaRow,
  validarTareaNueva,
  type TareaRow
} from '@/lib/tareas';
import {
  COLS_TAREA,
  leerJsonTareas,
  relacionInvalida,
  type FilaTareaNueva
} from '@/lib/tareasServer';
import { padreValidoNueva } from '@/lib/subtareas';
import type { TareaEstado } from '@/lib/types';

const MENSAJE_RELACION: Record<string, string> = {
  proyectos: 'Proyecto invalido',
  objetivos: 'Objetivo invalido',
  ideas: 'Idea invalida'
};

/** GET /api/tareas?proyecto_id=&estado=&hoy=1 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const params = new URL(request.url).searchParams;
    const proyectoId = params.get('proyecto_id');
    if (proyectoId !== null && !esUuid(proyectoId)) {
      return NextResponse.json({ error: 'Proyecto invalido' }, { status: 400 });
    }

    const estado = params.get('estado');
    if (estado !== null && estado !== 'pendiente' && estado !== 'hecha') {
      return NextResponse.json({ error: 'Estado invalido' }, { status: 400 });
    }

    const hoy = params.get('hoy');
    if (hoy !== null && hoy !== '1' && hoy !== '0') {
      return NextResponse.json({ error: 'Filtro hoy invalido' }, { status: 400 });
    }

    let query = supabase.from('tareas').select(COLS_TAREA);
    if (proyectoId) query = query.eq('proyecto_id', proyectoId);

    if (hoy === '1') {
      // pendientes de hoy o sin fecha, de cualquier proyecto
      query = query
        .eq('estado', 'pendiente')
        .or(`fecha.is.null,fecha.lte.${fechaHoyISO()}`);
    } else if (estado) {
      query = query.eq('estado', estado as TareaEstado);
    }

    const { data, error } = await query
      .order('fecha', { ascending: true, nullsFirst: false })
      .order('orden', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(200);
    if (error) throw error;

    const tareas = ((data ?? []) as TareaRow[]).map(mapTareaRow);
    return NextResponse.json({ tareas });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST /api/tareas: crea una tarea ligada opcionalmente a proyecto/objetivo/idea */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const datos = validarTareaNueva(await leerJsonTareas(request));
    if (datos === null) {
      return NextResponse.json({ error: 'Datos de la tarea invalidos' }, { status: 400 });
    }

    /* paso 4: si es subtarea, el padre debe ser raiz propio y del mismo
     * proyecto; la subtarea hereda el proyecto del padre */
    if (datos.parent_id) {
      const padre = await padreValidoNueva(supabase, datos.parent_id);
      if (padre === null) {
        return NextResponse.json({ error: 'Subtarea invalida' }, { status: 400 });
      }
      if ((padre.proyecto_id ?? null) !== (datos.proyecto_id ?? null)) {
        return NextResponse.json(
          { error: 'La subtarea debe ser del proyecto de su padre' },
          { status: 400 }
        );
      }
    }

    const invalida = await relacionInvalida(supabase, datos);
    if (invalida) {
      return NextResponse.json({ error: MENSAJE_RELACION[invalida] }, { status: 400 });
    }

    const fila: FilaTareaNueva = { ...datos, parent_id: datos.parent_id || null };
    const { data, error } = await supabase
      .from('tareas')
      .insert({ ...fila, user_id: user.id })
      .select(COLS_TAREA)
      .single();
    if (error) throw error;

    return NextResponse.json({ tarea: mapTareaRow(data as TareaRow) }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
