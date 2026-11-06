import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { guardarMinuta } from '@/lib/ai/sugerencias';
import { guardarExternas } from '@/lib/ai/externa';
import { validarItemsExterna } from '@/lib/externas';

/**
 * PUT /api/ai/sugerencias/[id] (modulo 3): accion del usuario sobre una
 * sugerencia con la regla Foundation #4 "la AI sugiere, tu apruebas":
 *   categoria -> 'aceptada' SOLO cuando el usuario guarda el CategorizarSheet
 *   (cliente llama tras el guardado: aqui solo se marca el estado)
 *   conexion  -> aceptar tras un POST real a /api/conexiones
 *   minuta    -> aceptar guarda ai_minuta en ideas.entidades (base mod 7)
 *   descartar / descartar_permanente (hash del item en payload: no volver)
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const accion = typeof body?.accion === 'string' ? body.accion : '';
    if (!['aceptar', 'descartar', 'descartar_permanente'].includes(accion)) {
      return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });
    }

    const { data: previa, error: errLeer } = await supabase
      .from('sugerencias')
      .select('id,idea_id,tipo,payload,estado')
      .eq('id', id)
      .single();
    if (errLeer) throw errLeer;

    if (accion === 'descartar_permanente') {
      // hash del item en payload: el analizador de esta idea y su tipo ya no la
      // vuelven (/state 'descartada_permanente' bloquea en sugerenciasVivas)
      const { error } = await supabase
        .from('sugerencias')
        .update({
          estado: 'descartada_permanente',
          payload: { ...(previa.payload ?? {}), hash: `${previa.idea_id}:${previa.tipo}` }
        })
        .eq('id', id);
      if (error) throw error;
      return NextResponse.json({ ok: true, estado: 'descartada_permanente' });
    }

    const estado = accion === 'aceptar' ? 'aceptada' : 'descartada';
    if (estado === 'aceptada' && previa.tipo === 'minuta') {
      const pasos = (previa.payload as { pasos?: unknown })?.pasos;
      if (!Array.isArray(pasos) || pasos.length === 0) {
        return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });
      }
      await guardarMinuta(
        supabase,
        String(previa.idea_id),
        (pasos as unknown[]).filter((p): p is string => typeof p === 'string').slice(0, 10)
      );
    }
    if (estado === 'aceptada' && previa.tipo === 'externa') {
      /* items seleccionados en el sheet o todos los del payload; SOLO aqui se
       * escriben en ideas.entidades.externa (spec modulo 10, nada automatico) */
      const payload = (previa.payload ?? {}) as { items?: unknown };
      const delCuerpo = body?.items;
      const crudos = Array.isArray(delCuerpo)
        ? delCuerpo
        : Array.isArray(payload.items)
          ? payload.items
          : [];
      const items = validarItemsExterna(crudos.slice(0, 20));
      if (items.length === 0) {
        return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });
      }
      await guardarExternas(supabase, String(previa.idea_id), items);
    }
    const { error } = await supabase
      .from('sugerencias')
      .update({ estado })
      .eq('id', id);
    if (error) throw error;
    return NextResponse.json({ ok: true, estado });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
