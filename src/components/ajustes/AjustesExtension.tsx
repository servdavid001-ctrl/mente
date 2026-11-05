import SeccionAjustes from './SeccionAjustes';
import ChipEstado from './ChipEstado';
import PasosExtension from './PasosExtension';
import TokensPanel from '@/components/extension/TokensPanel';

/** Extension: descarga del ZIP, pasos de instalacion y tokens de captura */
export default function AjustesExtension() {
  return (
    <SeccionAjustes
      id="extension"
      titulo="Extension de Chrome v1.0.0"
      descripcion="Guarda texto, links y capturas de pantalla desde el navegador."
      chip={<ChipEstado>Instalacion manual</ChipEstado>}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 rounded-card border border-border px-3 py-3">
          <span className="min-w-0 flex-1 text-[13px]">
            <span className="block font-semibold text-text">mente-extension.zip</span>
            <span className="block text-[12px] text-text-soft">Incluye manifest.json en la raiz</span>
          </span>
          <a
            href="/downloads/mente-extension.zip"
            download
            className="flex h-11 items-center rounded-xl bg-[var(--accent-strong)] px-4 text-[13px] font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)]"
          >
            Descargar extension
          </a>
        </div>

        <div>
          <h3 className="text-[13px] font-semibold text-text">Instalar en Chrome</h3>
          <div className="mt-2">
            <PasosExtension />
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <h3 className="mb-2 text-[13px] font-semibold text-text">Token de captura</h3>
          <TokensPanel />
        </div>
      </div>
    </SeccionAjustes>
  );
}
