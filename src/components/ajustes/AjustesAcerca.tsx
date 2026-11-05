import SeccionAjustes from './SeccionAjustes';

const PRODUCCION = 'https://mente-ten-iota.vercel.app';
const REPO = 'https://github.com/servdavid001-ctrl/mente';

/** Acerca de: version, enlaces y datos de alojamiento */
export default function AjustesAcerca() {
  return (
    <SeccionAjustes id="acerca" titulo="Acerca de" descripcion="Que es Mente y donde vive.">
      <div className="space-y-3 text-[13px] leading-snug text-text-soft">
        <p className="font-display text-2xl font-semibold lowercase tracking-tight text-text">
          mente<span className="text-accent">.</span>
        </p>
        <p>Mente v1.0.0. Un sistema personal de captura y foco. Solo para ti.</p>
        <p>Alojado en Supabase (us-east-1). Extension de Chrome v1.0.0.</p>
        <ul className="space-y-1">
          <li>
            <a href={PRODUCCION} target="_blank" rel="noreferrer" className="underline underline-offset-4">
              Produccion
            </a>
          </li>
          <li>
            <a href={REPO} target="_blank" rel="noreferrer" className="underline underline-offset-4">
              Repositorio en GitHub
            </a>
          </li>
        </ul>
      </div>
    </SeccionAjustes>
  );
}
