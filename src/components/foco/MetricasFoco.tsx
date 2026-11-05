export default function MetricasFoco(props: {
  proyectosDesplegados: number;
  objetivosActivos: number;
  ideasSinProyecto: number;
}) {
  const datos = [
    { label: 'Proyectos desplegados', valor: props.proyectosDesplegados },
    { label: 'Objetivos activos', valor: props.objetivosActivos },
    { label: 'Ideas sin proyecto', valor: props.ideasSinProyecto }
  ];

  return (
    <dl className="grid grid-cols-3 gap-2" aria-label="Estado de tu Foco">
      {datos.map((dato) => (
        <div
          key={dato.label}
          className="flex flex-col-reverse gap-1 rounded-card border border-border bg-surface px-2.5 py-3 text-center"
        >
          <dt className="text-[11px] leading-tight text-text-soft">{dato.label}</dt>
          <dd className="font-display text-2xl font-semibold leading-none">{dato.valor}</dd>
        </div>
      ))}
    </dl>
  );
}
