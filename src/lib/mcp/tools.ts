/** source of truth de las 9 tools del servidor MCP (modulo 15/19).
 * Pure data sin imports server: lo consume /api/mcp (tools/list) y la UI
 * de permisos en /ajustes (interruptores por conector). */

export type CampoTool = { type: string; description: string };
export type DefinicionTool = {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, CampoTool>;
    required?: string[];
  };
};

function campo(type: string, description: string): CampoTool {
  return { type, description };
}

function esquema(
  props: Record<string, CampoTool>,
  required?: string[]
): DefinicionTool['inputSchema'] {
  return required ? { type: 'object', properties: props, required } : { type: 'object', properties: props };
}

export const HERRAMIENTAS_MCP: DefinicionTool[] = [
  {
    name: 'buscar_tareas',
    description: 'Devuelve hasta 50 tareas pendientes del usuario ordenadas por fecha.',
    inputSchema: esquema({
      asignado_a: campo('string', 'Filtro yo|opencode|muse|grok; por defecto el propio worker')
    })
  },
  {
    name: 'obtener_plan',
    description: 'Devuelve el plan del proyecto: paginas (titulo + contenido, max 20) y tareas pendientes.',
    inputSchema: esquema({ proyecto: campo('string', 'Nombre o uuid del proyecto') }, ['proyecto'])
  },
  {
    name: 'leer_investigacion',
    description: 'Devuelve hasta 10 investigaciones del proyecto como texto plano (raiz + subpaginas).',
    inputSchema: esquema({
      proyecto: campo('string', 'Nombre o uuid del proyecto'),
      titulo: campo('string', 'Titular inicial para filtrar la raiz (opcional)')
    }, ['proyecto'])
  },
  {
    name: 'crear_nota',
    description: 'Crea una nota de texto dentro del proyecto (estado proyecto, max 2000 chars).',
    inputSchema: esquema({
      proyecto: campo('string', 'Nombre o uuid del proyecto'),
      texto: campo('string', 'Contenido de la nota (1-2000 chars)')
    }, ['proyecto', 'texto'])
  },
  {
    name: 'crear_subpagina',
    description: 'Crea una subpagina hija de una pagina existente del proyecto (max profundidad 3).',
    inputSchema: esquema({
      proyecto: campo('string', 'Nombre o uuid del proyecto'),
      pagina_titulo: campo('string', 'Primera linea de la pagina padre'),
      texto: campo('string', 'Contenido de la subpagina (1-2000 chars)')
    }, ['proyecto', 'pagina_titulo', 'texto'])
  },
  {
    name: 'crear_tarea',
    description: 'Crea una tarea pendiente en el proyecto (titulo max 200 chars).',
    inputSchema: esquema({
      proyecto: campo('string', 'Nombre o uuid del proyecto'),
      titulo: campo('string', 'Titulo de la tarea (1-200 chars)'),
      nota: campo('string', 'Nota opcional (max 2000 chars)'),
      asignado_a: campo('string', 'yo|opencode|muse|grok; por defecto el propio worker'),
      fecha: campo('string', 'Fecha ISO YYYY-MM-DD opcional')
    }, ['proyecto', 'titulo'])
  },
  {
    name: 'terminar_tarea',
    description: 'Marca la tarea como hecha y, si hay resultado, lo deja como nota del proyecto.',
    inputSchema: esquema({
      id: campo('string', 'Uuid de la tarea'),
      resultado: campo('string', 'Resultado como nota del proyecto (max 2000 chars, opcional)')
    }, ['id'])
  },
  {
    name: 'importar_investigacion',
    description: 'Importa una investigacion: raiz + hasta 10 subpaginas hijas (max 2000 chars cada una).',
    inputSchema: esquema({
      proyecto: campo('string', 'Nombre o uuid del proyecto'),
      titulo: campo('string', 'Titulo de la raiz (1-200 chars)'),
      cuerpo: campo('string', 'Texto de la raiz (max 2000 chars)'),
      subpaginas: campo('array', 'Hijas [{titulo, texto}] (max 10, opcionales)')
    }, ['proyecto', 'titulo', 'cuerpo'])
  },
  {
    name: 'pedir_anexo',
    description: 'Pide algo a David: nota en la bandeja con la marca del worker.',
    inputSchema: esquema({
      mensaje: campo('string', 'Lo que se pide (1-2000 chars)'),
      proyecto: campo('string', 'Nombre o uuid del proyecto (opcional)')
    }, ['mensaje'])
  }
];

/** nombres de las 9 tools en el orden del catalogo (defaults de permisos) */
export const NOMBRES_MCP: string[] = HERRAMIENTAS_MCP.map((t) => t.name);
