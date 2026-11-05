'use client';

import { useState } from 'react';
import TokensExtensionList from './TokensExtensionList';
import { useTokensExtension } from './useTokensExtension';

/** modulo 5: tarjeta para generar/revocar tokens de la extension Chrome */
export default function ExtensionCard() {
  const { tokens, cargando, error, nuevo, ocupado, generar, revocar } = useTokensExtension();
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    if (!nuevo) return;
    try {
      await navigator.clipboard.writeText(nuevo);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

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

      <button
        type="button"
        aria-label="Generar token de captura"
        disabled={ocupado}
        onClick={() => void generar()}
        className="h-11 w-full rounded-card bg-accent px-4 text-[14px] font-semibold text-white disabled:opacity-50"
      >
        Generar token
      </button>

      {nuevo ? (
        <div role="status" className="space-y-2 rounded-card bg-accent-soft px-3 py-3">
          <p className="text-[13px] font-semibold">
            Copia este token ahora. No se vuelve a mostrar.
          </p>
          <code className="block break-all rounded-card bg-surface px-2 py-2 text-[12px]">
            {nuevo}
          </code>
          <button
            type="button"
            aria-label="Copiar token al portapapeles"
            onClick={() => void copiar()}
            className="h-9 rounded-blob border border-border px-3 text-[12px] font-semibold text-text"
          >
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      ) : null}

      {cargando ? <p className="text-[13px] text-text-soft">Cargando tokens...</p> : null}

      {!cargando && tokens.length > 0 ? (
        <TokensExtensionList
          tokens={tokens}
          ocupado={ocupado}
          onRevocar={(id) => void revocar(id)}
        />
      ) : null}

      {!cargando && tokens.length === 0 && !error ? (
        <p className="text-[13px] text-text-soft">Aun no hay tokens generados.</p>
      ) : null}

      <details className="text-[13px] text-text-soft">
        <summary className="cursor-pointer font-semibold">Como instalar</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Abre chrome://extensions y activa el modo desarrollador.</li>
          <li>Carga la carpeta extension/ como desempaquetada.</li>
          <li>Abre la extension y pega la URL de Mente y el token generado.</li>
        </ol>
      </details>
    </section>
  );
}
