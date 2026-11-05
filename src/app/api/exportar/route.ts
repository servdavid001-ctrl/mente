import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/** tablas del usuario exportables; RLS filtra por user_id en cada una */
const TABLAS = [
  'ideas',
  'proyectos',
  'objetivos',
  'tareas',
  'colecciones',
  'conexiones',
  'sugerencias'
] as const;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const datos: Record<string, unknown> = {};
    for (const tabla of TABLAS) {
      const { data, error } = await supabase
        .from(tabla)
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      datos[tabla] = data ?? [];
    }

    const fecha = new Date().toISOString().slice(0, 10);
    const cuerpo = JSON.stringify(
      { exportadoEl: new Date().toISOString(), ...datos },
      null,
      2
    );

    return new NextResponse(cuerpo, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="mente-export-${fecha}.json"`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
