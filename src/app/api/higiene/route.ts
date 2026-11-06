import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { recogerRecomendaciones } from '@/lib/higieneServer';

/* modulo 9: GET /api/higiene (solo GET). Es una consulta pura del usuario: no
 * altera datos, no pasa por la AI. Detecta y pregunta; el usuario aprueba. */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const recomendaciones = await recogerRecomendaciones(supabase);
    return NextResponse.json({ recomendaciones });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
