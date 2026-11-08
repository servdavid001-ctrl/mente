'use client';

import Link from 'next/link';
import ListaTokensAgente from './ListaTokensAgente';
import WizardConector from './WizardConector';
import { useTokensAgente } from './useTokensAgente';
import { NOMBRES_MCP } from '@/lib/mcp/tools';

/** seccion Acceso para agentes (modulo 19): wizard Añadir conector en un
 * paso + fila expandible por token con interruptores de permisos por tool */
export default function AjustesAgentes() {
  const estado = useTokensAgente();

  async function copiar(token: string) {
    try {
      await navigator.clipboard.writeText(token);
    } catch {
      /* sin permiso de clipboard: el token sigue visible para copiar a mano */
    }
  }

  function permisosDe(id: string): string[] {
    return estado.tokens.find((token) => token.id === id)?.permisos ?? NOMBRES_MCP;
  }

  function togglePermisos(id: string, nombre: string, activo: boolean) {
    const actuales = permisosDe(id);
    const lista =
      nombre === 'todas'
        ? NOMBRES_MCP
        : nombre === 'ninguna'
          ? []
          : activo && !actuales.includes(nombre)
            ? [...actuales, nombre]
            : !activo
              ? actuales.filter((n) => n !== nombre)
              : actuales;
    void estado.guardarPermisos(id, lista);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <WizardConector
          ocupado={estado.ocupado}
          permisosDe={permisosDe}
          onCopiar={(t) => void copiar(t)}
          onToggle={togglePermisos}
          onCrear={(nombre) => estado.generar(nombre)}
        />
        <Link
          href="/integraciones"
          className="h-11 rounded-xl border border-[var(--border-control)] px-3 text-[13px] font-semibold text-text"
        >
          Ver documentacion publica
        </Link>
      </div>

      {estado.error ? <p role="alert" className="text-[13px] text-danger">{estado.error}</p> : null}

      {estado.toast ? (
        <div role="status" className="rounded-card bg-danger/15 px-3 py-2 text-[13px] text-danger">
          {estado.toast}
        </div>
      ) : null}

      {estado.cargando ? (
        <p className="text-[13px] text-text-soft">Cargando conectores...</p>
      ) : (
        <ListaTokensAgente
          tokens={estado.tokens}
          ocupado={estado.ocupado}
          onRevocar={(id) => void estado.revocar(id)}
          onToggle={togglePermisos}
        />
      )}
    </div>
  );
}
