'use client';

import { useState } from 'react';
import TokensExtensionList from '@/components/foco/TokensExtensionList';
import { useTokensExtension } from '@/components/foco/useTokensExtension';

/** panel compacto de tokens: misma API que ExtensionCard, reutilizable en Ajustes */
export default function TokensPanel() {
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
    <div className="space-y-3">
      <button
        type="button"
        disabled={ocupado}
        onClick={() => void generar()}
        className="h-11 rounded-xl bg-[var(--accent-strong)] px-4 text-[13px] font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        Generar token
      </button>

      {nuevo ? (
        <div role="status" className="space-y-2 rounded-card bg-accent-soft px-3 py-3">
          <p className="text-[13px] font-semibold">
            Copia este token ahora. No se vuelve a mostrar.
          </p>
          <code className="block break-all rounded-xl bg-surface px-2 py-2 text-[12px]">
            {nuevo}
          </code>
          <button
            type="button"
            onClick={() => void copiar()}
            className="h-9 rounded-xl border border-[var(--border-control)] px-3 text-[12px] font-semibold text-text"
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
        <p className="text-[13px] text-text-soft">Aun no hay tokens.</p>
      ) : null}

      <p className="text-[12px] text-text-soft">
        Si el token deja de funcionar, revocalo y genera otro.
      </p>
    </div>
  );
}
