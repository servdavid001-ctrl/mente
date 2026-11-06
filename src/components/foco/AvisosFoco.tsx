/** estados de carga/aviso de la vista /foco: esqueleto inicial, banner de
 * error con reintento y toast accionable (modulo 11, plantilla compartida). */

export function BannerAvisoFoco(props: {
  error?: string;
  toast: string | null;
  onReintentar?: () => void;
}) {
  if (props.error) {
    return (
      <div className="rounded-card bg-danger px-4 py-3 text-sm text-white">
        {props.error}
        {props.onReintentar ? (
          <button
            type="button"
            onClick={props.onReintentar}
            className="ml-2 h-9 rounded-blob border border-white px-3 text-[13px] font-semibold"
          >
            Reintentar
          </button>
        ) : null}
      </div>
    );
  }
  if (props.toast) {
    return (
      <p role="alert" className="rounded-card bg-danger px-4 py-2.5 text-sm text-white">
        {props.toast}
      </p>
    );
  }
  return null;
}

export function EsqueletoFoco() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="anim-shimmer h-20 w-full rounded-card bg-gradient-to-r from-border via-surface to-border" />
      <div className="anim-shimmer h-44 w-full rounded-card bg-border" />
      <div className="anim-shimmer h-16 w-full rounded-card bg-border" />
    </div>
  );
}
