'use client';

import Link from 'next/link';
import TokensPanel from '@/components/extension/TokensPanel';

/** modulo 5: extension de Chrome con descarga, guia y tokens de captura */
export default function ExtensionCard() {
  return (
    <section
      aria-label="Extension de Chrome"
      className="space-y-3 rounded-card border border-border bg-surface p-4"
    >
      <header>
        <h2 className="font-display text-xl font-semibold">Extension de Chrome</h2>
        <p className="text-[13px] text-text-soft">
          Guarda texto, links y capturas de pantalla desde el navegador.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <a
          href="/downloads/mente-extension.zip"
          download
          className="flex h-10 items-center rounded-xl bg-[var(--accent-strong)] px-3 text-[13px] font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)]"
        >
          Descargar ZIP
        </a>
        <Link href="/ajustes" className="text-[13px] font-semibold text-text-soft underline-offset-4 hover:underline">
          Guia completa en Ajustes
        </Link>
      </div>

      <TokensPanel />
    </section>
  );
}
