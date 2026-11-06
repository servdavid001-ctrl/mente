import type { Idea, Objetivo, ObjetivoEstado, Proyecto } from './types';

/* modulo 4: constantes, validacion compartida (API) y helpers de fetch (UI) */

export const COLOR_PROYECTO_DEFAULT = '#C96F4A';
export const MAX_NOMBRE_PROYECTO = 80;
export const MAX_DESC_PROYECTO = 1000;
export const MAX_TITULO_OBJETIVO = 160;
export const MAX_DESC_OBJETIVO = 4000;

/** paleta de proyecto: reutiliza los 8 dots de Biblioteca + el color por defecto */
export const COLORES_PROYECTO: Array<{ hex: string; nombre: string }> = [
  { hex: COLOR_PROYECTO_DEFAULT, nombre: 'Terracota suave' },
  { hex: '#E86A33', nombre: 'Terracota' },
  { hex: '#A87B1F', nombre: 'Mostaza' },
  { hex: '#6B7F45', nombre: 'Oliva' },
  { hex: '#2F6F5E', nombre: 'Petroleo' },
  { hex: '#3D5A80', nombre: 'Tinta' },
  { hex: '#7B5C8E', nombre: 'Violeta' },
  { hex: '#C25E7E', nombre: 'Rosa' }
];

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
const FECHA_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ESTADOS: ObjetivoEstado[] = ['activo', 'logrado', 'archivado'];

export function esUuid(valor: unknown): valor is string {
  return typeof valor === 'string' && UUID_RE.test(valor);
}

export function esColor(valor: unknown): valor is string {
  return typeof valor === 'string' && COLOR_RE.test(valor);
}

/** fecha ISO date (YYYY-MM-DD) y existente en el calendario */
export function esFechaISO(valor: unknown): valor is string {
  if (typeof valor !== 'string') return false;
  const m = FECHA_RE.exec(valor);
  if (!m) return false;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return (
    d.getUTCFullYear() === Number(m[1]) &&
    d.getUTCMonth() === Number(m[2]) - 1 &&
    d.getUTCDate() === Number(m[3])
  );
}

export type ProyectoRow = {
  id: unknown;
  nombre: unknown;
  descripcion?: string | null;
  color?: string | null;
  plegado?: boolean | null;
  orden?: number | null;
  created_at: unknown;
  updated_at?: unknown;
};

export type ObjetivoRow = {
  id: unknown;
  proyecto_id?: string | null;
  titulo: unknown;
  descripcion?: string | null;
  estado?: string | null;
  fecha?: string | null;
  created_at: unknown;
  updated_at?: unknown;
};

export type IdeaConteoRow = { proyecto_id?: string | null; archivada?: boolean | null };
export type ObjetivoConteoRow = { proyecto_id?: string | null; estado?: string | null };
export type TareaConteoRow = { proyecto_id?: string | null; estado?: string | null };

/** hechas (estado 'hecha') y total por proyecto */
export function contarTareas(filas: TareaConteoRow[]): Record<string, { hechas: number; total: number }> {
  const porProyecto: Record<string, { hechas: number; total: number }> = {};
  for (const fila of filas) {
    if (typeof fila.proyecto_id !== 'string' || fila.proyecto_id.length === 0) continue;
    const conteo = (porProyecto[fila.proyecto_id] ??= { hechas: 0, total: 0 });
    conteo.total += 1;
    if (fila.estado === 'hecha') conteo.hechas += 1;
  }
  return porProyecto;
}

export function mapProyectoRow(
  row: ProyectoRow,
  counts: {
    ideas: number;
    objetivosActivos: number;
    tareas?: { hechas: number; total: number };
  }
): Proyecto {
  return {
    id: String(row.id),
    nombre: String(row.nombre),
    descripcion: row.descripcion ?? null,
    color: row.color ?? COLOR_PROYECTO_DEFAULT,
    plegado: Boolean(row.plegado),
    orden: Number(row.orden ?? 0),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at ?? row.created_at),
    ideasCount: counts.ideas,
    objetivosActivos: counts.objetivosActivos,
    tareasHechas: counts.tareas?.hechas ?? 0,
    tareasTotal: counts.tareas?.total ?? 0
  };
}

export function mapObjetivoRow(row: ObjetivoRow): Objetivo {
  const estado = (row.estado ?? 'activo') as ObjetivoEstado;
  return {
    id: String(row.id),
    proyectoId: row.proyecto_id ?? null,
    titulo: String(row.titulo),
    descripcion: row.descripcion ?? null,
    estado: ESTADOS.includes(estado) ? estado : 'activo',
    fecha: row.fecha ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at ?? row.created_at)
  };
}

/** conteos por proyecto (ideas no archivadas) + ideas sin proyecto */
export function contarIdeas(ideas: IdeaConteoRow[]): {
  porProyecto: Record<string, number>;
  sinProyecto: number;
} {
  const porProyecto: Record<string, number> = {};
  let sinProyecto = 0;
  for (const idea of ideas) {
    if (idea.archivada === true) continue;
    if (typeof idea.proyecto_id === 'string' && idea.proyecto_id.length > 0) {
      porProyecto[idea.proyecto_id] = (porProyecto[idea.proyecto_id] ?? 0) + 1;
    } else {
      sinProyecto += 1;
    }
  }
  return { porProyecto, sinProyecto };
}

/** objetivos activos por proyecto */
export function contarObjetivosActivos(
  objetivos: ObjetivoConteoRow[]
): Record<string, number> {
  const porProyecto: Record<string, number> = {};
  for (const objetivo of objetivos) {
    if (objetivo.estado !== 'activo') continue;
    if (typeof objetivo.proyecto_id === 'string' && objetivo.proyecto_id.length > 0) {
      porProyecto[objetivo.proyecto_id] = (porProyecto[objetivo.proyecto_id] ?? 0) + 1;
    }
  }
  return porProyecto;
}

/* -- validacion estricta de payloads (server) -- */

export function validarProyectoNuevo(
  body: unknown
): { nombre: string; descripcion: string | null; color: string } | null {
  if (!esObjeto(body)) return null;
  if (!esNombreProyecto(body.nombre)) return null;
  const descripcion = normalizarDescripcion(body.descripcion, MAX_DESC_PROYECTO);
  if (descripcion === undefined) return null;
  if (body.color !== undefined && body.color !== null && !esColor(body.color)) return null;
  return {
    nombre: body.nombre.trim(),
    descripcion,
    color: typeof body.color === 'string' ? body.color : COLOR_PROYECTO_DEFAULT
  };
}

export function validarCambiosProyecto(body: unknown): Record<string, unknown> | null {
  if (!esObjeto(body)) return null;
  const claves = Object.keys(body);
  if (claves.length === 0) return null;
  const permitidas = new Set(['nombre', 'descripcion', 'color', 'plegado', 'orden']);
  if (claves.some((clave) => !permitidas.has(clave))) return null;

  const cambios: Record<string, unknown> = {};
  if ('nombre' in body) {
    if (!esNombreProyecto(body.nombre)) return null;
    cambios.nombre = body.nombre.trim();
  }
  if ('descripcion' in body) {
    const descripcion = normalizarDescripcion(body.descripcion, MAX_DESC_PROYECTO);
    if (descripcion === undefined) return null;
    cambios.descripcion = descripcion;
  }
  if ('color' in body) {
    if (!esColor(body.color)) return null;
    cambios.color = body.color;
  }
  if ('plegado' in body) {
    if (typeof body.plegado !== 'boolean') return null;
    cambios.plegado = body.plegado;
  }
  if ('orden' in body) {
    if (!esEntero32(body.orden)) return null;
    cambios.orden = body.orden;
  }
  return cambios;
}

export function validarObjetivoNuevo(body: unknown): {
  titulo: string;
  descripcion: string | null;
  proyecto_id: string | null;
  fecha: string | null;
} | null {
  if (!esObjeto(body)) return null;
  const permitidas = new Set(['titulo', 'descripcion', 'proyecto_id', 'fecha']);
  if (Object.keys(body).some((clave) => !permitidas.has(clave))) return null;
  if (!esTituloObjetivo(body.titulo)) return null;
  const descripcion = normalizarDescripcion(body.descripcion, MAX_DESC_OBJETIVO);
  if (descripcion === undefined) return null;
  if (body.proyecto_id !== undefined && body.proyecto_id !== null && !esUuid(body.proyecto_id)) {
    return null;
  }
  if (body.fecha !== undefined && body.fecha !== null && !esFechaISO(body.fecha)) return null;
  return {
    titulo: body.titulo.trim(),
    descripcion,
    proyecto_id: typeof body.proyecto_id === 'string' ? body.proyecto_id : null,
    fecha: typeof body.fecha === 'string' ? body.fecha : null
  };
}

export function validarCambiosObjetivo(body: unknown): Record<string, unknown> | null {
  if (!esObjeto(body)) return null;
  const claves = Object.keys(body);
  if (claves.length === 0) return null;
  const permitidas = new Set(['titulo', 'descripcion', 'estado', 'fecha']);
  if (claves.some((clave) => !permitidas.has(clave))) return null;

  const cambios: Record<string, unknown> = {};
  if ('titulo' in body) {
    if (!esTituloObjetivo(body.titulo)) return null;
    cambios.titulo = body.titulo.trim();
  }
  if ('descripcion' in body) {
    const descripcion = normalizarDescripcion(body.descripcion, MAX_DESC_OBJETIVO);
    if (descripcion === undefined) return null;
    cambios.descripcion = descripcion;
  }
  if ('estado' in body) {
    if (typeof body.estado !== 'string' || !ESTADOS.includes(body.estado as ObjetivoEstado)) {
      return null;
    }
    cambios.estado = body.estado;
  }
  if ('fecha' in body) {
    if (body.fecha !== null && !esFechaISO(body.fecha)) return null;
    cambios.fecha = body.fecha;
  }
  return cambios;
}

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esNombreProyecto(valor: unknown): valor is string {
  return (
    typeof valor === 'string' &&
    valor.trim().length >= 1 &&
    valor.trim().length <= MAX_NOMBRE_PROYECTO
  );
}

function esTituloObjetivo(valor: unknown): valor is string {
  return (
    typeof valor === 'string' &&
    valor.trim().length >= 1 &&
    valor.trim().length <= MAX_TITULO_OBJETIVO
  );
}

/** undefined = invalido, null = vacio, string = valor limpio */
function normalizarDescripcion(valor: unknown, max: number): string | null | undefined {
  if (valor === undefined || valor === null) return null;
  if (typeof valor !== 'string') return undefined;
  const limpio = valor.trim();
  if (limpio.length > max) return undefined;
  return limpio === '' ? null : limpio;
}

function esEntero32(valor: unknown): valor is number {
  return (
    typeof valor === 'number' &&
    Number.isInteger(valor) &&
    valor >= -2147483648 &&
    valor <= 2147483647
  );
}

/* -- guardian suave -- */

export function diasSinCambios(iso: string): number {
  const entonces = new Date(iso).getTime();
  if (Number.isNaN(entonces)) return 0;
  return Math.floor((Date.now() - entonces) / 86400000);
}

/** aviso suave: nunca bloquea, solo sugiere plegar o revisar un proyecto */
export function mensajeGuardian(proyectos: Proyecto[]): string | null {
  const desplegados = proyectos.filter((p) => !p.plegado);
  if (desplegados.length > 3) {
    return `Tienes ${desplegados.length} proyectos en el aire. Plegar uno te devuelve foco.`;
  }
  const olvidado = desplegados.find(
    (p) => p.ideasCount === 0 && diasSinCambios(p.updatedAt) > 14
  );
  if (olvidado) {
    return `"${olvidado.nombre}" lleva mas de 14 dias sin cambios. ¿Sigue vivo?`;
  }
  return null;
}

/* -- fetch helpers cliente -- */

export type RespuestaProyectos = { proyectos: Proyecto[]; sinProyecto: number };
export type RespuestaProyecto = { proyecto: Proyecto; objetivos: Objetivo[]; ideas: Idea[] };

export type DatosProyecto = { nombre: string; color?: string; descripcion?: string | null };
export type DatosObjetivo = {
  titulo: string;
  descripcion?: string | null;
  proyecto_id?: string | null;
  fecha?: string | null;
};

async function pedir<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', ...init });
  if (!res.ok) {
    let mensaje = 'Error';
    try {
      const json = (await res.json()) as { error?: string };
      if (json.error) mensaje = json.error;
    } catch {
      /* respuesta sin json: se usa el mensaje generico */
    }
    throw new Error(mensaje);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function listarProyectos(): Promise<RespuestaProyectos> {
  return pedir<RespuestaProyectos>('/api/proyectos');
}

export function cargarProyecto(id: string): Promise<RespuestaProyecto> {
  return pedir<RespuestaProyecto>(`/api/proyectos/${id}`);
}

export async function crearProyecto(datos: DatosProyecto): Promise<Proyecto> {
  const res = await pedir<{ proyecto: Proyecto }>('/api/proyectos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  return res.proyecto;
}

export async function actualizarProyecto(
  id: string,
  cambios: Record<string, unknown>
): Promise<Proyecto> {
  const res = await pedir<{ proyecto: Proyecto }>(`/api/proyectos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cambios)
  });
  return res.proyecto;
}

export function borrarProyecto(id: string): Promise<void> {
  return pedir<void>(`/api/proyectos/${id}`, { method: 'DELETE' });
}

export async function listarObjetivos(proyectoId?: string): Promise<Objetivo[]> {
  const url = proyectoId
    ? `/api/objetivos?proyecto_id=${encodeURIComponent(proyectoId)}`
    : '/api/objetivos';
  const res = await pedir<{ objetivos: Objetivo[] }>(url);
  return res.objetivos;
}

export async function crearObjetivo(datos: DatosObjetivo): Promise<Objetivo> {
  const res = await pedir<{ objetivo: Objetivo }>('/api/objetivos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  return res.objetivo;
}

export async function actualizarObjetivo(
  id: string,
  cambios: Record<string, unknown>
): Promise<Objetivo> {
  const res = await pedir<{ objetivo: Objetivo }>(`/api/objetivos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cambios)
  });
  return res.objetivo;
}

export function borrarObjetivo(id: string): Promise<void> {
  return pedir<void>(`/api/objetivos/${id}`, { method: 'DELETE' });
}
