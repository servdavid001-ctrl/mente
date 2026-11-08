import { HERRAMIENTAS_MCP } from '@/lib/mcp/tools';

/** mod 19 doc publica: tabla de las 9 tools. Source of truth compartido
 * (lib/mcp/tools.ts): la tabla nunca se desincroniza del servidor MCP. */

export default function TablaTools() {
  return (
    <section className="rounded-card border border-border bg-surface px-4 py-4 md:rounded-blob">
      <h2 className="font-display text-[20px] font-semibold leading-tight">
        2. Herramientas (v1: 9)
      </h2>
      <p className="mt-1 text-[14px] text-text-soft">
        Todas leen o escriben dentro del proyecto del dueno del token (user_id derivado
        del token). Limites: tareas 50 por respuesta, paginas 20, subpaginas 10, texto
        2000 chars, titulo 200 chars.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-border text-text-soft">
              <th className="py-2 pr-3 font-semibold">Herramienta</th>
              <th className="py-2 pr-3 font-semibold">Que hace</th>
              <th className="py-2 font-semibold">Argumentos requeridos</th>
            </tr>
          </thead>
          <tbody>
            {HERRAMIENTAS_MCP.map((tool) => (
              <tr key={tool.name} className="align-top">
                <td className="py-2 pr-3 font-mono text-[12px] text-text">{tool.name}</td>
                <td className="py-2 pr-3 text-text-soft">{tool.description}</td>
                <td className="py-2 font-mono text-[12px] text-text-soft">
                  {tool.inputSchema.required?.join(', ') ?? 'ninguno'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
