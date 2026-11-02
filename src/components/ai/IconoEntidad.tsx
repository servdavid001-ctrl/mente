/** iconos de entidades por tipo (spec 11): lucide 16px inline, aria-hidden;
 * el label textual vive en el span que lo envuelve (a1y base). */
const CAMINOS: Record<string, string[]> = {
  autor: ['M12 20h9', 'M16.4 3.6a1.2 1.2 0 0 1 3 3L8.4 17.6l-4 1.2 1.2-4z'],
  libro: ['M4 19.5V4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5a2.5 2.5 0 0 0 0 5H20'],
  persona: ['M19 21v-1.5a4.5 4.5 0 0 0-4.5-4.5h-5A4.5 4.5 0 0 0 5 19.5V21', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  lugar: ['M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z', 'M14 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0z'],
  marca: ['M22 22V9h-9v13', 'M2 22V5l7 4v13', 'M2 22h20', 'M6 9v2M6 13v2M13 12v2M13 16v2M17 12v2M17 16v2'],
  concepto: ['M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z', 'M8 8h.01']
};

export default function IconoEntidad(props: { tipo: string }) {
  const caminos = CAMINOS[props.tipo] ?? CAMINOS.concepto;
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {caminos.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
