import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { mapIdeaRow, SELECT_IDEA } from '@/lib/ideas';
type Params = { params: { id: string } };

/**
 * el blob ya se sube DESDE el cliente directo al bucket biblioteca-media con su
 * sesion (RLS lo gatea, igual que ideas-audio); aqui solo se guarda el puntero
 * y la idea pasa a tipo 'arte' (adicion documentada, spec filtro Arte §2).
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = await request.json();
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });
    }
    const { ruta } = (body ?? {}) as Record<string, unknown>;
    if (typeof ruta !== 'string' || !esRutaPropia(ruta, user.id)) {
      return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('ideas')
      .update({ media_url: ruta, tipo: 'arte' })
      .eq('id', params.id)
      .eq('estado', 'biblioteca')
      .select(SELECT_IDEA)
      .single();
    if (error) throw error;

    return NextResponse.json({ idea: mapIdeaRow(data) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** solo 2 tramos user/uuid.ext, sin traversal ni carpetas ajenas */
function esRutaPropia(ruta: string, uid: string): boolean {
  const tramos = ruta.split('/');
  if (tramos.length !== 2 || tramos[0] !== uid) return false;
  const nombre = tramos[1];
  return nombre.length > 0 && !nombre.includes('..');
}
