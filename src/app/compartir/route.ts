import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { leerCampos, leerMedia } from '@/lib/compartir';
import { guardarCompartir } from '@/lib/compartirServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** share-target con screenshot: multipart/form-data.
 * Solo POST: mutar por GET permitia CSRF desde cualquier web. */
export async function POST(request: Request) {
  return manejar(request, true);
}

async function manejar(request: Request, conArchivos: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirigir(request, '/login');

  try {
    const fuente = conArchivos
      ? await request.formData()
      : new URL(request.url).searchParams;
    const campos = leerCampos((nombre) => fuente.get(nombre));
    const media = conArchivos ? await leerMedia(fuente.get('media')) : null;

    const resultado = await guardarCompartir(supabase, user.id, campos, media);
    if (!resultado.guardado) return redirigir(request, '/?compartir=vacio');

    if (resultado.soloArte) return redirigir(request, '/biblioteca?compartir=ok');
    return redirigir(request, '/?compartir=ok');
  } catch (error: unknown) {
    // sin volcar contenido compartido al log
    const message = error instanceof Error ? error.message : 'Error';
    console.error('compartir: fallo al guardar', message);
    return redirigir(request, '/?compartir=error');
  }
}

function redirigir(request: Request, ruta: string) {
  return NextResponse.redirect(new URL(ruta, request.url), 303);
}
