import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { esUuid } from '@/lib/foco';
import { cargarProyectoConDetalle } from '@/lib/focoServer';
import { credencialesUsuario } from '@/lib/ai/credenciales';
import { MENSAJE_AI_INDISPONIBLE, chat } from '@/lib/ai/provider';
import {
  PREFIJO_FUNDAMENTO,
  propuestaDe
} from '@/lib/fundamento';
import { datosFundamento, mensajesFundamento } from '@/lib/fundamentoPrompt';

type Params = { params: Promise<{ id: string }> };

/** cap del contenido existente devuelto para mostrarlo en la sheet */
const CAP_EXISTENTE = 4000;

/**
 * POST /api/proyectos/[id]/fundamento (modulo 16 B): genera el draft del
 * fundamento con UNA llamada al provider bajo la clave del usuario (patron
 * explicar: rate consumir_analisis + credencialesUsuario; 429/503 con copy
 * fijo, sin keys en el body). NUNCA guarda nada: responde { propuesta } y la
 * UI crea la pagina via POST /api/ideas. Regla v1 (una sola): si ya hay una
 * pagina cuyo texto empieza por 'Fundamento - ' responde { existe: true,
 * contenido } sin gastar la llamada ni el analisis (contenido es una
 * extension del { existe: true } de la spec para mostrarlo en la sheet).
 */
export async function POST(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    if (!esUuid(id)) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

    const detalle = await cargarProyectoConDetalle(supabase, id);
    if (!detalle) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });

    const existente = detalle.ideas.find((i) => i.text.startsWith(PREFIJO_FUNDAMENTO));
    if (existente) {
      return NextResponse.json({
        existe: true,
        contenido: existente.text.slice(0, CAP_EXISTENTE)
      });
    }

    /* rate atomico (security definer): se consume solo con sesion valida */
    const { data: permitido, error: errRate } = await supabase.rpc('consumir_analisis', {
      p_max: 50
    });
    if (errRate) throw errRate;
    if (permitido !== true) {
      return NextResponse.json(
        { error: 'Has usado tu analisis de hoy. Vuelve manana — tus ideas siguen intactas.' },
        { status: 429 }
      );
    }

    const credenciales = await credencialesUsuario(user.id);
    const respuesta = await chat(
      mensajesFundamento(datosFundamento(detalle)),
      credenciales
    );
    const propuesta = propuestaDe(respuesta);
    if (!propuesta) throw new Error('Tu AI no respondio. Reintentar');
    return NextResponse.json({ propuesta });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    if (message === MENSAJE_AI_INDISPONIBLE) {
      return NextResponse.json({ error: MENSAJE_AI_INDISPONIBLE }, { status: 503 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
