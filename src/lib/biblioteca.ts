import type { Coleccion, Conexion, DotColor, IdeaKind } from './types';

/** paleta cerrada de los 8 dots (spec §1): hex en DB char(7), token en UI */
export const DOT_HEX: Record<DotColor, string> = {
  terracota: '#E86A33',
  mostaza: '#A87B1F',
  oliva: '#6B7F45',
  petroleo: '#2F6F5E',
  tinta: '#3D5A80',
  violeta: '#7B5C8E',
  rosa: '#C25E7E',
  marron: '#8B5E3C'
};

/** hex guardado -> token DotColor (undefined cuando la coleccion no tiene color) */
export function colorADot(color: string | null | undefined): DotColor | undefined {
  if (!color) return undefined;
  const hex = color.trim().toLowerCase();
  const token = (Object.keys(DOT_HEX) as DotColor[]).find(
    (k) => DOT_HEX[k].toLowerCase() === hex
  );
  return token;
}

export function mapColeccionRow(row: ColeccionRow): Coleccion {
  return {
    id: String(row.id),
    nombre: String(row.nombre),
    color: colorADot(row.color)
  };
}

type ColeccionRow = { id: unknown; nombre: unknown; color?: string | null };

export function mapConexionRow(row: ConexionRow): Conexion {
  return {
    id: String(row.id),
    desdeId: String(row.desde_id),
    haciaId: String(row.hacia_id),
    nota: row.nota ?? undefined,
    creadoEl: String(row.created_at)
  };
}

type ConexionRow = {
  id: unknown;
  desde_id: unknown;
  hacia_id: unknown;
  nota?: string | null;
  created_at: unknown;
};

/** valida el color recibido por API contra la paleta cerrada */
export function dotValido(color: unknown): string | null {
  if (typeof color !== 'string' || color.trim() === '') return null;
  const token = (Object.keys(DOT_HEX) as DotColor[]).find(
    (k) => k === color.toLowerCase()
  );
  return token ? DOT_HEX[token] : null;
}

export const ETIQUETAS_TIPO: Record<IdeaKind, string> = {
  texto: 'Texto',
  voz: 'Nota de voz',
  link: 'Link',
  arte: 'Arte'
};

export const FILTRO_TIPO: Record<string, IdeaKind> = {
  texto: 'texto',
  voz: 'voz',
  link: 'link',
  arte: 'arte'
};

/** tope server-side de texto (audit P2-2) */
export const MAX_TEXTO = 20000;

/** detecta si un link es video embebible (YouTube o Vimeo) */
export function videoEmbedDe(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith('/shorts/')) {
        return `https://www.youtube.com/embed/${u.pathname.replace('/shorts/', '')}`;
      }
      if (u.pathname.startsWith('/embed/')) return url;
    }
    if (u.hostname.includes('vimeo.com')) {
      const seg = u.pathname.split('/').filter(Boolean)[0];
      if (seg && /^\d+$/.test(seg)) return `https://player.vimeo.com/video/${seg}`;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * parse minimo de la nota (spec §1: solo parrafos, **negrita** y viñetas):
 * devuelve filas { tipo, segmentos } sin HTML -- todo es React escapado.
 */
export type FilaNota = {
  tipo: 'parrafo' | 'vineta';
  segmentos: Array<{ texto: string; negrita: boolean }>;
};

export function parseNota(nota: string | null | undefined): FilaNota[] {
  if (!nota) return [];
  return nota
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((linea) => ({
      tipo: /^-\s/.test(linea.trim()) ? 'vineta' : 'parrafo',
      segmentos: segmentosDe(linea.replace(/^\s*-\s/, ''))
    }));
}

function segmentosDe(linea: string): FilaNota['segmentos'] {
  const out: FilaNota['segmentos'] = [];
  const partes = linea.split('**');
  partes.forEach((parte, i) => {
    if (parte === '') return;
    out.push({ texto: parte, negrita: i % 2 === 1 });
  });
  return out.length > 0 ? out : [{ texto: '', negrita: false }];
}
