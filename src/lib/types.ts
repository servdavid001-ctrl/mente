export type TabId = 'foco' | 'bandeja' | 'biblioteca';

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

/** shape de entidades jsonb: lista + minuta aceptada (ai_minuta, base mod 7) */
export type EntidadesItem = {
  lista: Entidad[];
  ai_minuta?: { pasos: string[]; guardada: string };
};

export type SugerenciaEstado =
  | 'pendiente'
  | 'aceptada'
  | 'descartada'
  | 'descartada_permanente';

export type SugerenciaTipo = 'categoria' | 'conexion' | 'entidades' | 'minuta';

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

export type Sugerencia = {
  id: string;
  ideaId: string;
  tipo: SugerenciaTipo;
  payload: Record<string, unknown>;
  estado: SugerenciaEstado;
};
