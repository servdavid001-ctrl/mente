'use client';

import { useState } from 'react';
import ConfirmInline from './ConfirmInline';
import PermisosToken from './PermisosToken';
import { fechaCorta } from '@/lib/extension';
import { NOMBRES_MCP } from '@/lib/mcp/tools';
import type { TokenAgente } from '@/lib/agentes';

/** listado de tokens de agentes: fila expandible con interruptores de
 * permisos por tool (modulo 19), estado y revocacion logica */
export default function ListaTokensAgente(props: {
  tokens: TokenAgente[];
  ocupado: boolean;
  onRevocar: (id: string) => void;
  onToggle: (id: string, nombre: string, activo: boolean) => void;
}) {
  return (
    <ul className="space-y-2">
      {props.tokens.map((token) => (
        <FilaTokenAgente
          key={token.id}
          token={token}
          ocupado={props.ocupado}
          onRevocar={props.onRevocar}
          onToggle={props.onToggle}
        />
      ))}
    </ul>
  );
}

function FilaTokenAgente(props: {
  token: TokenAgente;
  ocupado: boolean;
  onRevocar: (id: string) => void;
  onToggle: (id: string, nombre: string, activo: boolean) => void;
}) {
  const { token } = props;
  const revocado = token.revocado_en !== null;
  const [abierto, setAbierto] = useState(false);
  const activos = token.permisos ?? [];
  const etiquetaCuenta = revocado
    ? 'Revocado'
    : `${activos.length}/${NOMBRES_MCP.length}`;
  return (
    <li className="rounded-card border border-border px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setAbierto(!abierto)}
          aria-expanded={abierto}
          aria-label={`Permisos del conector ${token.nombre}`}
          className="shrink-0 rounded-blob p-1 text-text-soft hover:text-text"
        >
          <span aria-hidden="true" className={`block text-[12px] ${abierto ? 'rotate-90' : ''}`}>
            →
          </span>
        </button>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold text-text">{token.nombre}</span>
          <span className="block text-[12px] text-text-soft">
            Creado el {fechaCorta(token.created_at)} · usado{' '}
            {token.last_used_at ? fechaCorta(token.last_used_at) : 'nunca'}
          </span>
        </span>
        <span
          className={`shrink-0 rounded-blob px-2 py-0.5 text-[11px] font-semibold ${
            revocado ? 'bg-danger/15 text-danger' : 'bg-accent-soft text-text'
          }`}
        >
          {etiquetaCuenta}
        </span>
        {!revocado ? (
          <ConfirmInline
            etiqueta="Revocar"
            confirmacion="Si, revocar"
            disabled={props.ocupado}
            onConfirmar={() => props.onRevocar(token.id)}
            className="h-9 shrink-0 rounded-blob px-2 text-[12px] font-semibold text-danger disabled:opacity-50"
          />
        ) : null}
      </div>
      {abierto ? (
        <div className="mt-2 border-t border-border pt-2">
          {revocado ? (
            <p className="text-[12px] text-text-soft">Token revocado: sin permisos activos.</p>
          ) : (
            <PermisosToken
              token={{ id: token.id, permisos: token.permisos }}
              deshabilitado={props.ocupado}
              onToggle={(nombre, activo) => props.onToggle(token.id, nombre, activo)}
            />
          )}
        </div>
      ) : null}
    </li>
  );
}
