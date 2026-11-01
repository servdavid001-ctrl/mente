import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { mapIdeaRow } from '@/lib/ideas';
type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { data, error } = await supabase
      .from('ideas')
      .select('id,tipo,contenido,fuente,audio_url,created_at')
      .eq('id', params.id)
      .single();

    if (error) throw error;
    return NextResponse.json({ idea: mapIdeaRow(data) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = await request.json();
    if (typeof body !== 'object' || body === null || typeof body.archivada !== 'boolean') {
      return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('ideas')
      .update({ archivada: body.archivada })
      .eq('id', params.id)
      .select('id,tipo,contenido,fuente,audio_url,created_at')
      .single();

    if (error) throw error;
    return NextResponse.json({ idea: mapIdeaRow(data) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { error } = await supabase.from('ideas').delete().eq('id', params.id);
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
