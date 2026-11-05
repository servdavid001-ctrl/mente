import { MAX_TEXTO } from './biblioteca';
import type { CamposCompartir, MediaCompartir } from './compartir';
import { insertarIdea, proyectoPropio, subirMedia, type Cliente } from './compartirRepo';

export type ResultadoCompartir = {
  guardado: boolean;
  soloArte: boolean;
};

/**
 * Crea las ideas del share-target: link si hay URL, texto si hay contenido y
 * arte si llega una imagen valida (una captura puede ademas traer texto/url).
 */
export async function guardarCompartir(
  supabase: Cliente,
  userId: string,
  campos: CamposCompartir,
  media: MediaCompartir | null
): Promise<ResultadoCompartir> {
  const proyectoId = await proyectoPropio(supabase, userId, campos.proyecto);
  const texto = (campos.text || campos.title).slice(0, MAX_TEXTO);
  let guardado = false;
  let soloArte = false;

  if (campos.url !== null) {
    await insertarIdea(supabase, {
      user_id: userId,
      tipo: 'link',
      contenido: texto || campos.url,
      fuente: campos.url,
      estado: 'bandeja',
      proyecto_id: proyectoId
    });
    guardado = true;
  } else if (texto.length > 0) {
    await insertarIdea(supabase, {
      user_id: userId,
      tipo: 'texto',
      contenido: texto,
      estado: 'bandeja',
      proyecto_id: proyectoId
    });
    guardado = true;
  }

  if (media !== null) {
    const ruta = await subirMedia(supabase, userId, media);
    try {
      await insertarIdea(supabase, {
        user_id: userId,
        tipo: 'arte',
        contenido: null,
        estado: 'biblioteca',
        media_url: ruta,
        proyecto_id: proyectoId
      });
    } catch (error: unknown) {
      await supabase.storage.from('biblioteca-media').remove([ruta]);
      throw error;
    }
    soloArte = !guardado;
    guardado = true;
  }

  return { guardado, soloArte };
}
