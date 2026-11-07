'use client';

import { useState } from 'react';
import MontajeAgente from './MontajeAgente';
import ListaTokensAgente from './ListaTokensAgente';
import { useTokensAgente } from './useTokensAgente';

/** seccion Acceso para agentes: crear/copiar/revocar tokens + montaje */
export default function AjustesAgentes() {
  const estado = useTokensAgente();
  const [nombre, setNombre] = useState('');

  async function crear() {
    const limpio = nombre.trim();
    if (limpio.length === 0) return;
    setNombre('');
    await estado.generar(limpio);
  }

  async function copiar(token: string) {
    try {
      await navigator.clipboard.writeText(token);
    } catch {
      /* sin permiso de clipboard: el texto sigue visible para copiar a mano */
    }
  }

  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void crear();
        }}
      >
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del agente (opencode, muse, grok...)"
          maxLength={40}
          aria-label="Nombre del token de agente"
          className="h-11 min-w-0 flex-1 rounded-card border border-border bg-surface px-3 text-[14px] text-text placeholder:text-text-soft"
        />
        <button
          type="submit"
          disabled={estado.ocupado}
          className="h-11 shrink-0 rounded-xl bg-[var(--accent-strong)] px-4 text-[13px] font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          Crear token
        </button>
      </form>

      <MontajeAgente token={estado.nuevo} onCopiar={(t) => void copiar(t)} />

      {estado.nuevo ? (
        <div role="status" className="space-y-2 rounded-card bg-accent-soft px-3 py-3">
          <p className="text-[13px] font-semibold">Copia este token ahora. No se vuelve a mostrar.</p>
          <code className="block break-all rounded-xl bg-surface px-2 py-2 text-[12px]">
            {estado.nuevo}
          </code>
          <button
            type="button"
            onClick={() => void copiar(estado.nuevo!)}
            className="h-9 rounded-xl border border-[var(--border-control)] px-3 text-[12px] font-semibold text-text"
          >
            Copiar token
          </button>
        </div>
      ) : null}

      {estado.error ? <p role="alert" className="text-[13px] text-danger">{estado.error}</p> : null}

      {estado.cargando ? (
        <p className="text-[13px] text-text-soft">Cargando tokens...</p>
      ) : (
        <ListaTokensAgente
          tokens={estado.tokens}
          ocupado={estado.ocupado}
          onRevocar={(id) => void estado.revocar(id)}
        />
      )}
    </div>
  );
}
