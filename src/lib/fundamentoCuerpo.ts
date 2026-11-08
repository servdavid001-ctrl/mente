import { PREFIJO_FUNDAMENTO, type PropuestaFundamento } from './fundamento';

/* modulo 16 B: cuerpo markdown ligero del fundamento (alcance modulo 14 del
 * parser de paginas: #/## titulos y checks - [ ]; nada avanzado). El titulo
 * de la pagina es la primera linea del texto de la idea. */

export function tituloFundamento(nombre: string): string {
  return `${PREFIJO_FUNDAMENTO}${nombre}`;
}

export function cuerpoFundamento(p: PropuestaFundamento): string {
  const lista = (titulo: string, items: string[]) => [
    `## ${titulo}`,
    ...(items.length > 0 ? items.map((i) => `- [ ] ${i}`) : ['-']),
    ''
  ];
  return [
    '# Problema',
    '',
    p.problema,
    '',
    ...lista('Debe hacer', p.debe_hacer),
    ...lista('No debe hacer', p.no_debe),
    ...lista('Criterio de exito', p.criterio_exito),
    '## Siguiente paso',
    p.siguiente_paso || '-'
  ].join('\n');
}
