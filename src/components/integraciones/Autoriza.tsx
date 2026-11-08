/** mod 19 doc publica: como se autoriza un conector (Bearer token o device
 * flow). Componente server, sin estado. */

const URL_BASE = 'https://mente-ten-iota.vercel.app';

function Curl({ texto }: { texto: string }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-xl bg-surface px-3 py-2 text-[12px] text-text">
      <code>{texto}</code>
    </pre>
  );
}

export default function Autoriza() {
  return (
    <section className="space-y-2 rounded-card border border-border bg-surface px-4 py-4 md:rounded-blob">
      <h2 className="font-display text-[20px] font-semibold leading-tight">
        1. Como se autoriza un conector
      </h2>
      <p className="text-[14px] text-text-soft">
        Mente expone un servidor MCP por HTTP en <code>{URL_BASE}/api/mcp</code>. Hay dos
        formas de autorizar tu herramienta:
      </p>
      <ol className="list-inside list-decimal space-y-1 text-[14px] text-text-soft">
        <li>
          <span className="font-semibold text-text">Bearer token</span>: en Mente, /ajustes,
          seccion Acceso para agentes → Añadir conector. Obtienes un token mt_ de una sola
          vista; la cabecera es Authorization: Bearer mt_XXX en cada llamada.
        </li>
        <li>
          <span className="font-semibold text-text">Device flow (CLI)</span>:
          /api/mcp-login/start crea una solicitud; el dueno la aprueba en /conectar dentro
          de su sesion; tu CLI hace poll a /api/mcp-login/poll y recibe el token UNA vez.
        </li>
      </ol>
      <Curl
        texto={`curl -s -X POST ${URL_BASE}/api/mcp-login/start \\
  -H 'Content-Type: application/json' -d '{"nombre":"opencode"}'
# -> {"device_code":"dc_...","url":"${URL_BASE}/conectar?device=dc_...","expira_en":900}
# el dueno abre esa url con su sesion y aprueba o rechaza`}
      />
      <Curl
        texto={`curl -s -X POST ${URL_BASE}/api/mcp-login/poll \\
  -H 'Content-Type: application/json' -d '{"device_code":"dc_..."}'
# pendiente -> {"estado":"pendiente"} · aprobado -> {"estado":"granted","token":"mt_..."} una sola vez`}
      />
    </section>
  );
}
