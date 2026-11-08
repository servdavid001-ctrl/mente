import { tituloIdea } from './foco';
import type { ChatMsg } from './ai/provider';
import type { Idea, Objetivo, Proyecto } from './types';
import type { DatosFundamento } from './tiposFundamento';

/* modulo 16 B (fundamento): contexto ligero para el modelo y mensajes de la
 * UNICA llamada al provider (patron analizar/explicar de la app). */

const SYSTEM =
  'Eres un copiloto de proyectos; con estos datos del proyecto construye un '
  + 'documento fundacional claro. Respondes SOLO JSON compacto sin markdown '
  + 'con las claves: problema (string, el problema central), debe_hacer '
  + '(array de hasta 4 frases accionables), no_debe (array de hasta 4 cosas '
  + 'que NO hay que hacer), criterio_exito (array de hasta 4 criterios '
  + 'verificables), siguiente_paso (string). Escribes en espanol, sin tildes, '
  + 'concreto y corto.';

/** proyecto + objetivos activos (hasta 4) + notas del proyecto (hasta 40) */
export function datosFundamento(detalle: {
  proyecto: Proyecto;
  objetivos: Objetivo[];
  ideas: Idea[];
}): DatosFundamento {
  return {
    nombre: detalle.proyecto.nombre,
    descripcion: detalle.proyecto.descripcion ?? null,
    objetivos: detalle.objetivos
      .filter((o) => o.estado === 'activo')
      .slice(0, 4)
      .map((o) =>
        `${o.titulo}${o.descripcion ? `: ${o.descripcion.slice(0, 300)}` : ''}`
      ),
    notas: detalle.ideas.slice(0, 40).map((i) => {
      const nota = i.nota ? `: ${i.nota.slice(0, 200)}` : '';
      return `${tituloIdea(i).slice(0, 120)}${nota}`;
    })
  };
}

/** system + user del prompt con el contexto encajado (cap 6000 chars) */
export function mensajesFundamento(datos: DatosFundamento): ChatMsg[] {
  const bloques = [
    `Proyecto: ${datos.nombre.slice(0, 200)}`,
    datos.descripcion ? `Descripcion: ${datos.descripcion.slice(0, 800)}` : '',
    datos.objetivos.length
      ? `Objetivos activos:\n- ${datos.objetivos.join('\n- ').slice(0, 2000)}`
      : '',
    datos.notas.length
      ? `Notas del proyecto:\n- ${datos.notas.join('\n- ').slice(0, 3400)}`
      : '',
    'Si falta contexto, propone lo esencial partiendo de cero; no inventes datos internos.'
  ].filter(Boolean);
  const contexto = bloques.join('\n').slice(0, 6000);
  return [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: `Datos del proyecto:\n${contexto}` }
  ];
}
