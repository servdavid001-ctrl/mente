'use client';

import { useState } from 'react';
import ConfirmInline from './ConfirmInline';
import { fechaCorta } from '@/lib/extension';
import type { TokenAgente } from '@/lib/agentes';

/** listado de tokens de agentes: nombre, estado y revocacion logica */
export default function ListaTokensAgente(props: {
  tokens: TokenAgente[];
  ocupado: boolean;
  onRevocar: (id: string) => void;
}) {
  return (
    <ul className="space-y-2">
      {props.tokens.map((token) => (
        <FilaTokenAgente
          key={token.id}
          token={token}
          ocupado={props.ocupado}
          onRevocar={props.onRevocar}
        />
      ))}
    </ul>
  );
}

function FilaTokenAgente(props: {
  token: TokenAgente;
  ocupado: boolean;
  onRevocar: (id: string) => void;
}) {
  const { token } = props;
  const revocado = token.revocado_en !== null;
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-card border border-border px-3 py-2">
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
        {revocado ? 'Revocado' : 'Activo'}
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
    </li>
  );
}
