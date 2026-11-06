export type TabId = 'foco' | 'bandeja' | 'biblioteca' | 'ajustes';

export type IdeaKind = 'texto' | 'voz' | 'link' | 'arte';

// extension modulo 2: estado del semaforo por idea (categorizada o no).
// Modulo 1 const false: el badge es slot intercambiable y ahora lleva ✓.
export type IdeaEstado = 'bandeja' | 'biblioteca' | 'proyecto' | 'investigacion';

export type Idea = {
  id: string;
  text: string;
  kind: IdeaKind;
  sourceUrl?: string;
  createdAt: string;
  categorized: boolean;
  // datos de Biblioteca (modulo 2)
  estado?: IdeaEstado;
  archivada?: boolean;
  colecciones?: string[];
  mediaUrl?: string | null;
  nota?: string | null;
  // datos AI (modulo 3)
  transcripcion?: string | null;
  entidades?: EntidadesItem | null;
  // modulo 4: proyecto al que pertenece la idea (null = sin proyecto)
  proyectoId?: string | null;
  // modulo 13 (paginas): padre dentro del proyecto; null = raiz del listado
  parentId?: string | null;
};

// extendido con sourceUrl usado para voz: el CaptureBar sube el audio al bucket
// y entrega `<user_id>/<archivo>.webm` por ese campo (contrato intacto)
export type IdeaPayload = {
  text: string;
  sourceUrl?: string;
  kind: IdeaKind;
};

// tokens de la spec modulo 2: los 8 y unicamente esos 8
export type DotColor =
  | 'terracota'
  | 'mostaza'
  | 'oliva'
  | 'petroleo'
  | 'tinta'
  | 'violeta'
  | 'rosa'
  | 'marron';

export type Coleccion = {
  id: string;
  nombre: string;
  color?: DotColor;
};

// conexion dirigida idea -> idea (contrato spec §9)
export type Conexion = {
  id: string;
  desdeId: string;
  haciaId: string;
  nota?: string;
  creadoEl: string;
};

/* extension modulo 3 (AI organizadora): entidades + sugerencias */

export type TipoEntidad = 'autor' | 'libro' | 'persona' | 'lugar' | 'marca' | 'concepto';
export type Entidad = { nombre: string; tipo: TipoEntidad };

/** shape de entidades jsonb: lista + minuta aceptada (ai_minuta, base mod 7)
 * + fichas externas aceptadas (externa, modulo 10); preservar keys ajena */
export type EntidadesItem = {
  lista: Entidad[];
  ai_minuta?: { pasos: string[]; guardada: string };
  externa?: ItemExterno[];
};

/** ficha de conocimiento externo (modulo 10 #5): catalogs publicos + AI */
export type FuenteExterna = 'google_books' | 'openlibrary' | 'ai';

export type ItemExterno = {
  fuente: FuenteExterna;
  titulo: string;
  autor: string | null;
  anio: string | null;
  coverUrl: string | null;
  url: string | null;
  /** frase de 1 linea de la AI personalizada a la idea (null en sinonimos) */
  frase: string | null;
};

export type SugerenciaEstado =
  | 'pendiente'
  | 'aceptada'
  | 'descartada'
  | 'descartada_permanente';

export type SugerenciaTipo = 'categoria' | 'conexion' | 'entidades' | 'minuta' | 'externa';

export type SugerenciaPayloadCategoria = {
  nombreColeccion: string;
  esNueva?: boolean;
};

export type SugerenciaPayloadConexion = {
  haciaId: string;
  tituloItem: string;
  tipo: string;
  motivo: string;
};

export type SugerenciaPayloadMinuta = { pasos: string[] };

export type SugerenciaPayloadExterna = { items: ItemExterno[]; generado: string };

export type SugerenciaSheet = {
  sugerenciaId: string;
  ideaId: string;
  coleccionId?: string;
  nombreColeccion: string;
  esNueva?: boolean;
  dotColor?: DotColor;
};

export type Sugerencia = {
  id: string;
  ideaId: string;
  tipo: SugerenciaTipo;
  payload: Record<string, unknown>;
  estado: SugerenciaEstado;
};

/** chip de la Bandeja (spec 12): dato + id de la sugerencia viva detras */
export type ChipSugerenciaUI = {
  sugerenciaId: string;
  ideaId: string;
  nombreColeccion: string;
  esNueva?: boolean;
  dotColor?: DotColor;
  coleccionId?: string;
};

/* extension modulo 4 (Foco): proyectos + objetivos */

export type Proyecto = {
  id: string;
  nombre: string;
  descripcion?: string | null;
  color: string;
  plegado: boolean;
  orden: number;
  createdAt: string;
  updatedAt: string;
  /** ideas no archivadas asignadas al proyecto */
  ideasCount: number;
  /** objetivos con estado 'activo' */
  objetivosActivos: number;
  /** tareas del proyecto (modulo 11: progreso de la tarjeta; null = sin conteo) */
  tareasHechas?: number;
  tareasTotal?: number;
};

export type ObjetivoEstado = 'activo' | 'logrado' | 'archivado';

export type Objetivo = {
  id: string;
  proyectoId?: string | null;
  titulo: string;
  descripcion?: string | null;
  estado: ObjetivoEstado;
  fecha?: string | null;
  createdAt: string;
  updatedAt: string;
};

/* extension modulo 7 (acciones/tareas): "guardado" se vuelve "hecho" */

export type TareaEstado = 'pendiente' | 'hecha';

export type Tarea = {
  id: string;
  proyectoId?: string | null;
  objetivoId?: string | null;
  ideaId?: string | null;
  titulo: string;
  nota?: string | null;
  estado: TareaEstado;
  fecha?: string | null;
  orden: number;
  createdAt: string;
  updatedAt: string;
};
