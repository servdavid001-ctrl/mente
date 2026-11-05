import { MAX_TEXTO } from './biblioteca';
import { esHttp } from './captura';
import { construirArte } from './capturaArte';
import type { SupabaseAdmin } from '@/utils/supabase/admin';

export type CapturaConstruida = {
  fila: Record<string, unknown>;
  /** ruta del blob subido, para limpiarla si la insercion falla */
  ruta?: string;
};

/** valida el body de /api/captura y devuelve la fila lista para insertar */
export async function construirCaptura(
  admin: SupabaseAdmin,
  userId: string,
  body: unknown
): Promise<CapturaConstruida | null> {
  if (typeof body !== 'object' || body === null) return null;
  const datos = body as Record<string, unknown>;

  if (datos.tipo === 'texto') return construirTexto(datos, userId);
  if (datos.tipo === 'link') return construirLink(datos, userId);
  if (datos.tipo === 'arte') return construirArte(admin, datos, userId);
  return null;
}

function construirTexto(
  datos: Record<string, unknown>,
  userId: string
): CapturaConstruida | null {
  const contenido = textoValido(datos.contenido);
  if (contenido === null) return null;
  return {
    fila: {
      user_id: userId,
      tipo: 'texto',
      contenido,
      fuente: fuenteOpcional(datos.fuente),
      estado: 'bandeja'
    }
  };
}

function construirLink(
  datos: Record<string, unknown>,
  userId: string
): CapturaConstruida | null {
  const fuente = typeof datos.fuente === 'string' ? datos.fuente.trim() : '';
  if (!esHttp(fuente)) return null;

  let contenido = '';
  if (datos.contenido !== undefined && datos.contenido !== null) {
    if (typeof datos.contenido !== 'string') return null;
    if (datos.contenido.trim().length > 0) {
      const texto = textoValido(datos.contenido);
      if (texto === null) return null;
      contenido = texto;
    }
  }

  return {
    fila: {
      user_id: userId,
      tipo: 'link',
      contenido: contenido || fuente,
      fuente,
      estado: 'bandeja'
    }
  };
}

function textoValido(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const texto = valor.trim();
  return texto.length >= 1 && texto.length <= MAX_TEXTO ? texto : null;
}

function fuenteOpcional(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const fuente = valor.trim();
  return esHttp(fuente) ? fuente : null;
}
