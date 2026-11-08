/** mod 19 doc publica: config JSON de ejemplo para clientes MCP y nota de
 * muse/grok sin MCP. Componente server, sin estado. */

const URL_MCP = 'https://mente-ten-iota.vercel.app/api/mcp';

const CONFIG = JSON.stringify(
  {
    mcpServers: {
      mente: {
        type: 'http',
        url: URL_MCP,
        headers: { Authorization: 'Bearer mt_TU_TOKEN_DE_CONECTOR' }
      }
    }
  },
  null,
  2
);

export default function EjemplosConfig() {
  return (
    <section className="rounded-card border border-border bg-surface px-4 py-4 md:rounded-blob">
      <h2 className="font-display text-[20px] font-semibold leading-tight">
        3. Config JSON de ejemplo
      </h2>
      <p className="mt-1 text-[14px] text-text-soft">
        Sirve para opencode o para cualquier cliente MCP que acepte servidores HTTP
        (url + cabecera Authorization). Cambia mt_TU_TOKEN_DE_CONECTOR por tu token.
      </p>
      <pre className="mt-2 overflow-x-auto rounded-xl bg-surface px-3 py-2 text-[12px] text-text">
        <code>{CONFIG}</code>
      </pre>
      <p className="mt-3 text-[14px] text-text-soft">
        <span className="font-semibold text-text">Muse y Grok sin MCP:</span> si tu
        asistente no soporta MCP, no hace falta extenderlo aqui: usa Copiar recado por
        tarea en Mente, que deja el contexto listo en el formato correcto para cada uno.
        Si soporta cliente MCP por HTTP, con la config de arriba entra directo.
      </p>
    </section>
  );
}
