/** aviso suave del guardian: informa, nunca bloquea ni esconde proyectos */
export default function Guardian(props: { mensaje: string | null }) {
  if (!props.mensaje) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-2 rounded-card bg-accent-soft px-4 py-3 text-[13px] text-text"
    >
      <span aria-hidden="true" className="mt-0.5 text-accent">
        ◎
      </span>
      <p className="leading-snug">{props.mensaje}</p>
    </div>
  );
}
