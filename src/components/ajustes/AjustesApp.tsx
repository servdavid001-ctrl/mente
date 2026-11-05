import SeccionAjustes from './SeccionAjustes';
import InstalarPWA from './InstalarPWA';

const RELEASES = 'https://github.com/servdavid001-ctrl/mente/releases/latest';

/** App movil: PWA instalable, share-target y APK publicado por CI */
export default function AjustesApp() {
  return (
    <SeccionAjustes
      id="app-movil"
      titulo="App movil"
      descripcion="Instala Mente en tu telefono. Se abre como app y comparte capturas."
    >
      <div className="space-y-4">
        <div>
          <h3 className="mb-2 text-[13px] font-semibold text-text">Instalar la PWA</h3>
          <InstalarPWA />
        </div>

        <div className="rounded-card bg-accent-soft px-3 py-3">
          <p className="text-[13px] font-semibold text-text">Comparte desde cualquier app</p>
          <p className="mt-1 text-[12px] leading-snug text-text-soft">
            Elige Mente al compartir un link, un texto o una imagen y quedara en tu Bandeja.
            Requiere la PWA instalada.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <span className="min-w-0 flex-1 text-[13px]">
            <span className="block font-semibold text-text">APK para Android</span>
            <span className="block text-[12px] text-text-soft">
              APK generado por CI; si aun no hay release, usa la PWA.
            </span>
          </span>
          <a
            href={RELEASES}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 items-center rounded-xl border border-[var(--border-control)] px-4 text-[13px] font-semibold text-text"
          >
            Ver releases
          </a>
        </div>
      </div>
    </SeccionAjustes>
  );
}
