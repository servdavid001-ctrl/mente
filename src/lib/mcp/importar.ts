import {
  CAP_MCP,
  insertarIdeaMcp,
  resolverProyecto,
  textoMcp,
  type CtxMcp,
  type SalidaTool
} from './comun';

/** importar_investigacion: raiz + hasta 10 subpaginas hijas (solo insercion). */
export async function toolImportarInvestigacion(
  ctx: CtxMcp,
  args: unknown
): Promise<SalidaTool> {
  const arg = (args ?? {}) as {
    proyecto?: unknown; titulo?: unknown; cuerpo?: unknown; subpaginas?: unknown;
  };
  const proyecto = await resolverProyecto(ctx, arg.proyecto);
  if (proyecto === null) return { ok: false, mensaje: 'Proyecto no encontrado' };
  const titulo = textoMcp(arg.titulo, CAP_MCP.titulo);
  if (titulo === null) return { ok: false, mensaje: `titulo invalido (1-${CAP_MCP.titulo} chars)` };
  const cuerpo = textoMcp(arg.cuerpo, CAP_MCP.texto);
  if (cuerpo === null) return { ok: false, mensaje: `cuerpo invalido (1-${CAP_MCP.texto} chars)` };
  const hijos = validarHijos(arg.subpaginas);
  if (hijos === undefined) {
    return {
      ok: false,
      mensaje: `subpaginas invalidas (array de {titulo,texto}, max ${CAP_MCP.subpaginas})`
    };
  }

  const raizId = await insertarIdeaMcp(ctx, {
    parent_id: null,
    proyecto_id: proyecto.id,
    estado: 'investigacion',
    contenido: `${titulo}\n\n${cuerpo}`
  });

  let hijasCreadas = 0;
  for (const hijo of hijos ?? []) {
    await insertarIdeaMcp(ctx, {
      parent_id: raizId,
      proyecto_id: proyecto.id,
      estado: 'investigacion',
      contenido: hijo.texto === hijo.titulo ? hijo.titulo : `${hijo.titulo}\n\n${hijo.texto}`
    });
    hijasCreadas += 1;
  }

  return {
    ok: true,
    datos: {
      importada: 'investigacion',
      id: raizId,
      proyecto: proyecto.nombre,
      subpaginas: hijasCreadas
    }
  };
}

type HijoTexto = { titulo: string; texto: string };

/** undefined = invalido; null = sin hijas; lista = {titulo,texto} validos */
function validarHijos(valor: unknown): HijoTexto[] | null | undefined {
  if (valor === undefined || valor === null) return null;
  if (!Array.isArray(valor)) return undefined;
  if (valor.length > CAP_MCP.subpaginas) return undefined;
  const hijos: HijoTexto[] = [];
  for (const item of valor) {
    if (typeof item !== 'object' || item === null) return undefined;
    const { titulo, texto } = item as Record<string, unknown>;
    const t = textoMcp(titulo, CAP_MCP.titulo);
    if (t === null) return undefined;
    const cuerpo = typeof texto === 'string' ? texto.trim().slice(0, CAP_MCP.texto) : t;
    hijos.push({ titulo: t, texto: cuerpo.length >= 1 ? cuerpo : t });
  }
  return hijos;
}
