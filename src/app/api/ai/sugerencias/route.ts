import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  SELECT_SUGERENCIA,
  mapSugerenciaRow
} from '@/lib/ai/sugerencias';
import type { Sugerencia } from '@/lib/types';

/**
 * GET /api/ai/sugerencias (modulo 3): pendientes del usuario; opcional
 * ?idea_ids=a,b,c para una cochera de items (usa la Bandeja).
 */
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    let query = supabase
      .from('sugerencias')
      .select(SELECT_SUGERENCIA)
      .in('estado', ['pendiente', 'aceptada'])
      .order('created_at', { ascending: false });
    const conIdeas = new URL(request.url).searchParams.get('idea_ids');
    if (conIdeas) {
      const ids = conIdeas
        .split(',')
        .filter((id) => /^[0-9a-f-]{36}$/i.test(id))
        .slice(0, 100);
      if (ids.length === 0) return NextResponse.json({ sugerencias: [] });
      query = query.in('idea_id', ids);
    }
    const { data, error } = await query;
    if (error) throw error;
    const sugerencias: Sugerencia[] = (data ?? []).map(mapSugerenciaRow);
    return NextResponse.json({ sugerencias });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
