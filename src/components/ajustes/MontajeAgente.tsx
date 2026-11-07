'use client';

/** ejemplo de montaje del servidor MCP para un agente (opencode u otro) */
export default function MontajeAgente(props: {
  token: string | null;
  onCopiar: (token: string) => void;
}) {
  const bearer = props.token ? `Bearer ${props.token}` : 'Bearer mt_CUANDO_CREES_EL_TOKEN';
  const configa = JSON.stringify(
    {
      mcpServers: {
        mente: {
          type: 'http',
          url: 'https://mente-ten-iota.vercel.app/api/mcp',
          headers: { Authorization: bearer }
        }
      }
    },
    null,
    2
  );

  return (
    <div className="space-y-2 rounded-card border border-border px-3 py-3">
      <h3 className="text-[13px] font-semibold text-text">Conectar un agente</h3>
      <ol className="list-inside list-decimal space-y-1 text-[13px] text-text-soft">
        <li>Crea el token con el nombre del agente y copialo en el momento.</li>
        <li>En el config MCP del agente anade la seccion de abajo.</li>
        <li>Prueba pidiendo al agente la lista de tareas.</li>
      </ol>
      <pre className="overflow-x-auto rounded-xl bg-surface px-2 py-2 text-[12px] text-text">
        <code>{configa}</code>
      </pre>
      {props.token ? (
        <button
          type="button"
          onClick={() => props.onCopiar(props.token!)}
          className="h-9 rounded-xl border border-[var(--border-control)] px-3 text-[12px] font-semibold text-text"
        >
          Copiar config
        </button>
      ) : null}
    </div>
  );
}
