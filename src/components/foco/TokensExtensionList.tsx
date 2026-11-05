'use client';

import { fechaCorta, type TokenCaptura } from '@/lib/extension';

/** lista de tokens existentes con fecha de uso y accion de revocar */
export default function TokensExtensionList(props: {
  tokens: TokenCaptura[];
  ocupado: boolean;
  onRevocar: (id: string) => void;
}) {
  return (
    <ul className="space-y-1.5" aria-label="Tokens de captura">
      {props.tokens.map((token) => (
        <li
          key={token.id}
          className="flex items-center gap-2 rounded-card border border-border px-3 py-2"
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold">{token.nombre}</span>
            <span className="block text-[12px] text-text-soft">
              {fechaCorta(token.created_at)}
              {token.last_used_at ? ` · usado ${fechaCorta(token.last_used_at)}` : ' · sin usar'}
            </span>
          </span>
          <button
            type="button"
            aria-label={`Revocar token ${token.nombre}`}
            disabled={props.ocupado}
            onClick={() => props.onRevocar(token.id)}
            className="h-9 shrink-0 rounded-blob px-3 text-[12px] font-semibold text-danger disabled:opacity-50"
          >
            Revocar
          </button>
        </li>
      ))}
    </ul>
  );
}
