'use client';

import Link from 'next/link';
import PermisosToken from './PermisosToken';

/** vista unica del conector nuevo (modulo 19): token (copiar una vez),
 * config JSON del cliente MCP, interruptores de permisos ya activos y
 * nota para asistentes sin MCP. Reemplaza el camino manual de 3 pasos. */

const URL_MCP = 'https://mente-ten-iota.vercel.app/api/mcp';

function configJson(token: string): string {
  return JSON.stringify(
    {
      mcpServers: {
        mente: {
          type: 'http',
          url: URL_MCP,
          headers: { Authorization: `Bearer ${token}` }
        }
      }
    },
    null,
    2
  );
}

export default function VistaConector(props: {
  token: string;
  conectorId: string;
  permisos: string[];
  onCopiar: (token: string) => void;
  onToggle: (id: string, nombre: string, activo: boolean) => void;
}) {
  return (
    <div className="space-y-3 rounded-card border border-border px-3 py-3">
      <div role="status" className="space-y-2 rounded-card bg-accent-soft px-3 py-3">
        <p className="text-[13px] font-semibold">Copia este token ahora. No se vuelve a mostrar.</p>
        <code className="block break-all rounded-xl bg-surface px-2 py-2 text-[12px]">
          {props.token}
        </code>
        <button
          type="button"
          onClick={() => props.onCopiar(props.token)}
          className="h-9 rounded-xl border border-[var(--border-control)] px-3 text-[12px] font-semibold text-text"
        >
          Copiar token
        </button>
      </div>
      <div>
        <p className="text-[13px] font-semibold text-text">Config MCP del cliente</p>
        <pre className="mt-1 overflow-x-auto rounded-xl bg-surface px-2 py-2 text-[12px] text-text">
          <code>{configJson(props.token)}</code>
        </pre>
      </div>
      <PermisosToken
        token={{ id: props.conectorId, permisos: props.permisos }}
        onToggle={(nombre, activo) => props.onToggle(props.conectorId, nombre, activo)}
      />
      <p className="text-[12px] text-text-soft">
        Muse o Grok sin MCP: usa Copiar recado por tarea. Mas detalles en{' '}
        <Link href="/integraciones" className="underline underline-offset-4">
          Integraciones y MCP
        </Link>
        .
      </p>
    </div>
  );
}
