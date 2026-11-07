import { esFechaISO, esUuid } from './foco';
import type { Tarea, TareaEstado } from './types';

/* modulo 7: tareas ligadas a ideas, objetivos y proyectos.
 * Aqui vive lo compartido cliente/servidor: fila -> contrato, extraccion de
 * pasos (idea/minuta/objetivo), validacion estricta y fetch helpers. */

export const MAX_TITULO_TAREA = 200;
export const MAX_NOTA_TAREA = 2000;
export const MAX_PASOS = 20;
const MIN_PASO_TEXTO = 3;
const ESTADOS_TAREA: TareaEstado[] = ['pendiente', 'hecha'];

/* modulo 15: reparto de tareas entre el usuario y los workers */
export const ASIGNADOS_TAREA = ['yo', 'opencode', 'muse', 'grok'] as const;
export type AsignadoTarea = (typeof ASIGNADOS_TAREA)[number];

export type TareaRow = {
  id: unknown;
  proyecto_id?: string | null;
  objetivo_id?: string | null;
  idea_id?: string | null;
  titulo: unknown;
  nota?: string | null;
  estado?: string | null;
  asignado_a?: string | null;
  fecha?: string | null;
  orden?: number | null;
  created_at: unknown;
  updated_at?: unknown;
};

export function mapTareaRow(row: TareaRow): Tarea {
  const estado = (row.estado ?? 'pendiente') as TareaEstado;
  return {
    id: String(row.id),
    proyectoId: row.proyecto_id ?? null,
    objetivoId: row.objetivo_id ?? null,
    ideaId: row.idea_id ?? null,
    titulo: String(row.titulo),
    nota: row.nota ?? null,
    estado: ESTADOS_TAREA.includes(estado) ? estado : 'pendiente',
    asignado_a: esAsignadoValido(row.asignado_a),
    fecha: row.fecha ?? null,
    orden: Number(row.orden ?? 0),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at ?? row.created_at)
  };
}

/** asignado_a de la fila (modulo 15): valor del check-list o 'yo' por defecto */
function esAsignadoValido(valor: string | null | undefined): AsignadoTarea {
  return (ASIGNADOS_TAREA as readonly string[]).includes(valor ?? '')
    ? (valor as AsignadoTarea)
    : 'yo';
}

/** fecha de hoy (UTC, igual que current_date de Postgres) en YYYY-MM-DD */
export function fechaHoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/* -- extraccion de pasos -- */

type IdeaConPasos = {
  entidades?: unknown;
  nota?: string | null;
  text?: string | null;
  transcripcion?: string | null;
};

/** pasos ya destilados por la AI: acecha `ai_minuta.pasos` (string u objeto) */
export function extraerPasosMinuta(entidades: unknown): string[] {
  if (!esObjeto(entidades)) return [];
  const minuta = entidades.ai_minuta;
  if (!esObjeto(minuta) || !Array.isArray(minuta.pasos)) return [];

  const pasos: string[] = [];
  for (const paso of minuta.pasos) {
    const texto = textoDePaso(paso);
    if (!texto) continue;
    const limpio = texto.trim();
    if (limpio.length >= 1 && limpio.length <= MAX_TITULO_TAREA) pasos.push(limpio);
    if (pasos.length >= MAX_PASOS) break;
  }
  return pasos;
}

/** divide texto libre por lineas y bullets; 3-200 chars, maximo 20 pasos */
export function extraerPasosTexto(texto: string | null | undefined): string[] {
  if (typeof texto !== 'string' || texto.trim() === '') return [];

  const pasos: string[] = [];
  const lineas = texto.replace(/\r\n?/g, '\n').split(/\n|•/);
  for (const linea of lineas) {
    for (const trozo of linea.split(/\s+[-–]\s+/)) {
      const limpio = trozo
        .replace(/^\s*(?:[-–•*]|\d+[.)])\s*/, '')
        .trim();
      if (limpio.length < MIN_PASO_TEXTO || limpio.length > MAX_TITULO_TAREA) continue;
      pasos.push(limpio);
      if (pasos.length >= MAX_PASOS) return pasos;
    }
  }
  return pasos;
}

/** pasos de una idea: minuta primero; si no, nota > text > transcripcion */
export function extraerPasosIdea(idea: IdeaConPasos): string[] {
  const minuta = extraerPasosMinuta(idea.entidades);
  if (minuta.length > 0) return minuta;

  for (const fuente of [idea.nota, idea.text, idea.transcripcion]) {
    const pasos = extraerPasosTexto(fuente);
    if (pasos.length > 0) return pasos;
  }
  return [];
}

/** el boton "Convertir en tareas" solo aparece si hay algo que convertir */
export function ideaTieneContenidoParaTareas(idea: IdeaConPasos): boolean {
  if (extraerPasosMinuta(idea.entidades).length > 0) return true;
  return [idea.nota, idea.text, idea.transcripcion].some(
    (fuente) => typeof fuente === 'string' && fuente.trim() !== ''
  );
}

export function puedeCrearTareasObjetivo(descripcion: string | null | undefined): boolean {
  return extraerPasosTexto(descripcion).length > 0;
}

/* -- validacion estricta (server) -- */

export type TareaNueva = {
  titulo: string;
  nota: string | null;
  proyecto_id: string | null;
  objetivo_id: string | null;
  idea_id: string | null;
  fecha: string | null;
  orden: number;
};

export function validarTareaNueva(body: unknown): TareaNueva | null {
  if (!esObjeto(body)) return null;
  const permitidas = new Set([
    'titulo',
    'nota',
    'proyecto_id',
    'objetivo_id',
    'idea_id',
    'fecha',
    'orden'
  ]);
  if (Object.keys(body).some((clave) => !permitidas.has(clave))) return null;

  const titulo = normalizarTitulo(body.titulo);
  if (titulo === null) return null;
  const nota = normalizarNota(body.nota);
  if (nota === undefined) return null;
  const proyectoId = normalizarUuidOpcional(body.proyecto_id);
  if (proyectoId === undefined) return null;
  const objetivoId = normalizarUuidOpcional(body.objetivo_id);
  if (objetivoId === undefined) return null;
  const ideaId = normalizarUuidOpcional(body.idea_id);
  if (ideaId === undefined) return null;
  const fecha = normalizarFechaOpcional(body.fecha);
  if (fecha === undefined) return null;

  let orden = 0;
  if (body.orden !== undefined && body.orden !== null) {
    if (!esEntero32(body.orden)) return null;
    orden = body.orden;
  }

  return { titulo, nota, proyecto_id: proyectoId, objetivo_id: objetivoId, idea_id: ideaId, fecha, orden };
}

/** cambios aceptados por PUT /api/tareas/[id]; null = payload invalido */
export function validarCambiosTarea(body: unknown): Record<string, unknown> | null {
  if (!esObjeto(body)) return null;
  const claves = Object.keys(body);
  if (claves.length === 0) return null;
  const permitidas = new Set([
    'titulo',
    'nota',
    'estado',
    'fecha',
    'proyecto_id',
    'objetivo_id',
    'orden',
    'asignado_a'
  ]);
  if (claves.some((clave) => !permitidas.has(clave))) return null;

  const cambios: Record<string, unknown> = {};
  if ('titulo' in body) {
    const titulo = normalizarTitulo(body.titulo);
    if (titulo === null) return null;
    cambios.titulo = titulo;
  }
  if ('nota' in body) {
    const nota = normalizarNota(body.nota);
    if (nota === undefined) return null;
    cambios.nota = nota;
  }
  if ('estado' in body) {
    if (typeof body.estado !== 'string' || !ESTADOS_TAREA.includes(body.estado as TareaEstado)) {
      return null;
    }
    cambios.estado = body.estado;
  }
  if ('fecha' in body) {
    const fecha = normalizarFechaOpcional(body.fecha);
    if (fecha === undefined) return null;
    cambios.fecha = fecha;
  }
  if ('proyecto_id' in body) {
    const proyectoId = normalizarUuidOpcional(body.proyecto_id);
    if (proyectoId === undefined) return null;
    cambios.proyecto_id = proyectoId;
  }
  if ('objetivo_id' in body) {
    const objetivoId = normalizarUuidOpcional(body.objetivo_id);
    if (objetivoId === undefined) return null;
    cambios.objetivo_id = objetivoId;
  }
  if ('orden' in body) {
    if (!esEntero32(body.orden)) return null;
    cambios.orden = body.orden;
  }
  if ('asignado_a' in body) {
    if (typeof body.asignado_a !== 'string') return null;
    const valor = body.asignado_a;
    if (!(ASIGNADOS_TAREA as readonly string[]).includes(valor)) return null;
    cambios.asignado_a = valor;
  }
  return cambios;
}

/** body opcional de POST /api/ideas/[id]/tareas: solo `objetivo_id` */
export function validarObjetivoOpcional(
  body: unknown
): { objetivo_id: string | null } | null {
  if (body === undefined || body === null) return { objetivo_id: null };
  if (!esObjeto(body)) return null;
  if (Object.keys(body).some((clave) => clave !== 'objetivo_id')) return null;
  const objetivoId = normalizarUuidOpcional(body.objetivo_id);
  if (objetivoId === undefined) return null;
  return { objetivo_id: objetivoId };
}

/* -- fetch helpers cliente -- */

export type FiltrosTareas = {
  proyectoId?: string;
  estado?: TareaEstado;
  hoy?: boolean;
};

export type TareasCreadas = { tareas: Tarea[]; creadas: number };

export type DatosTarea = {
  titulo: string;
  nota?: string | null;
  proyecto_id?: string | null;
  objetivo_id?: string | null;
  idea_id?: string | null;
  fecha?: string | null;
  orden?: number;
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

export async function listarTareas(filtros: FiltrosTareas = {}): Promise<Tarea[]> {
  const params = new URLSearchParams();
  if (filtros.proyectoId) params.set('proyecto_id', filtros.proyectoId);
  if (filtros.estado) params.set('estado', filtros.estado);
  if (filtros.hoy) params.set('hoy', '1');
  const qs = params.toString();
  const res = await pedir<{ tareas: Tarea[] }>(`/api/tareas${qs ? `?${qs}` : ''}`);
  return res.tareas ?? [];
}

export async function crearTarea(datos: DatosTarea): Promise<Tarea> {
  const res = await pedir<{ tarea: Tarea }>('/api/tareas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  return res.tarea;
}

export async function actualizarTarea(
  id: string,
  cambios: Record<string, unknown>
): Promise<Tarea> {
  const res = await pedir<{ tarea: Tarea }>(`/api/tareas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cambios)
  });
  return res.tarea;
}

export function borrarTarea(id: string): Promise<void> {
  return pedir<void>(`/api/tareas/${id}`, { method: 'DELETE' });
}

export function crearTareasDesdeIdea(
  ideaId: string,
  objetivoId?: string | null
): Promise<TareasCreadas> {
  return pedir<TareasCreadas>(`/api/ideas/${ideaId}/tareas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(objetivoId ? { objetivo_id: objetivoId } : {})
  });
}

export function crearTareasDesdeObjetivo(objetivoId: string): Promise<TareasCreadas> {
  return pedir<TareasCreadas>(`/api/objetivos/${objetivoId}/tareas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
}

/* -- internos -- */

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function textoDePaso(paso: unknown): string | null {
  if (typeof paso === 'string') return paso;
  if (!esObjeto(paso)) return null;
  for (const clave of ['texto', 'paso', 'titulo']) {
    const valor = paso[clave];
    if (typeof valor === 'string') return valor;
  }
  return null;
}

function normalizarTitulo(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const limpio = valor.trim();
  if (limpio.length < 1 || limpio.length > MAX_TITULO_TAREA) return null;
  return limpio;
}

/** undefined = invalido; null = vacio; string = valor limpio */
function normalizarNota(valor: unknown): string | null | undefined {
  if (valor === undefined || valor === null) return null;
  if (typeof valor !== 'string') return undefined;
  const limpio = valor.trim();
  if (limpio.length > MAX_NOTA_TAREA) return undefined;
  return limpio === '' ? null : limpio;
}

function normalizarFechaOpcional(valor: unknown): string | null | undefined {
  if (valor === undefined || valor === null) return null;
  if (!esFechaISO(valor)) return undefined;
  return valor;
}

/** undefined = invalido; null = sin vinculo; string = uuid valido */
function normalizarUuidOpcional(valor: unknown): string | null | undefined {
  if (valor === undefined || valor === null) return null;
  if (!esUuid(valor)) return undefined;
  return valor;
}

function esEntero32(valor: unknown): valor is number {
  return (
    typeof valor === 'number' &&
    Number.isInteger(valor) &&
    valor >= -2147483648 &&
    valor <= 2147483647
  );
}
