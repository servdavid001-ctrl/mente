import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { esUuid } from '@/lib/foco';
import { COLS_TAREA } from '@/lib/tareasServer';
import { mapTareaRow, type TareaRow } from '@/lib/tareas';
import { contextoRecado } from '@/lib/recadosServer';
import { armarRecado } from '@/lib/recados';

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/tareas/[id]/recado (modulo 16 A): paquete de recado determinista
 * para enviar la tarea a un agente (muse/grok/opencode). Sin AI y sin
 * escritura: tarea + proyecto + objetivo activo + fundamento del proyecto
 * (si hay) via RLS. Devuelve { recado }; sin dato = '-' en la linea.
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    if (!esUuid(id)) return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });

    const { data: fila, error: errTarea } = await supabase
      .from('tareas')
      .select(COLS_TAREA)
      .eq('id', id)
      .maybeSingle();
    if (errTarea) throw errTarea;
    if (!fila) return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 });

    const tarea = mapTareaRow(fila as TareaRow);
    const contexto = await contextoRecado(supabase, tarea);
    return NextResponse.json({ recado: armarRecado({ tarea, ...contexto }) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
