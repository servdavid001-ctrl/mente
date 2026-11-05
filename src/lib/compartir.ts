import { MAX_TEXTO } from './biblioteca';
import { esHttp, esUuid, MAX_MEDIA_BYTES, MIME_PERMITIDOS, type MimePermitido } from './captura';

/** campos del share-target que llegan por query (GET) o form data (POST) */
export type CamposCompartir = {
  title: string;
  text: string;
  url: string | null;
  proyecto: string | null;
};

export type MediaCompartir = {
  buffer: Buffer;
  mime: MimePermitido;
  ext: string;
};

/** normaliza los campos sin confiar en el origen (share de cualquier app) */
export function leerCampos(get: (nombre: string) => unknown): CamposCompartir {
  return {
    title: limpiar(get('title')),
    text: limpiar(get('text')),
    url: urlValida(get('url')),
    proyecto: uuidValido(get('proyecto'))
  };
}

/** solo jpeg/png/webp hasta 10MB; cualquier otra cosa se descarta */
export async function leerMedia(valor: unknown): Promise<MediaCompartir | null> {
  if (!esArchivo(valor)) return null;
  if (valor.size <= 0 || valor.size > MAX_MEDIA_BYTES) return null;

  const mime = valor.type.trim().toLowerCase();
  if (!esMimePermitido(mime)) return null;

  const buffer = Buffer.from(await valor.arrayBuffer());
  if (buffer.length === 0 || buffer.length > MAX_MEDIA_BYTES) return null;

  return { buffer, mime, ext: MIME_PERMITIDOS[mime] };
}

function limpiar(valor: unknown): string {
  if (typeof valor !== 'string') return '';
  return valor.trim().slice(0, MAX_TEXTO);
}

function urlValida(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const url = valor.trim();
  return esHttp(url) ? url : null;
}

function uuidValido(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const id = valor.trim();
  return esUuid(id) ? id : null;
}

function esMimePermitido(mime: string): mime is MimePermitido {
  return Object.prototype.hasOwnProperty.call(MIME_PERMITIDOS, mime);
}

function esArchivo(valor: unknown): valor is Blob {
  if (typeof valor !== 'object' || valor === null) return false;
  const posible = valor as Partial<Blob>;
  return (
    typeof posible.arrayBuffer === 'function' &&
    typeof posible.size === 'number' &&
    typeof posible.type === 'string'
  );
}
