'use client';

import Interruptor from './Interruptor';
import { HERRAMIENTAS_MCP } from '@/lib/mcp/tools';
import type { TokenAgente } from '@/lib/agentes';

/** panel de permisos del conector (modulo 19): las 9 tools con interruptor
 * + Todas/Ninguna. Guardado por toggle (PUT optimista) via onToggle. */

const DESC_CORTA: Record<string, string> = {
  buscar_tareas: 'ver tareas pendientes',
  obtener_plan: 'leer plan del proyecto',
  leer_investigacion: 'leer investigaciones',
  crear_nota: 'crear notas',
  crear_subpagina: 'crear subpaginas',
  crear_tarea: 'crear tareas',
  terminar_tarea: 'marcar tareas hechas',
  importar_investigacion: 'importar investigaciones',
  pedir_anexo: 'pedirte algo (bandeja)'
};

export default function PermisosToken(props: {
  token: Pick<TokenAgente, 'id' | 'permisos'>;
  deshabilitado?: boolean;
  onToggle: (nombre: string, activo: boolean) => void;
}) {
  const activos = props.token.permisos ?? [];
  const todas = activos.length === HERRAMIENTAS_MCP.length;
  const ninguna = activos.length === 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-semibold text-text">Herramientas permitidas</p>
        <span className="flex gap-1">
          <button
            type="button"
            onClick={() => !todas && props.onToggle('todas', true)}
            disabled={props.deshabilitado}
            aria-label="Activar todas las herramientas"
            className="h-7 rounded-blob px-2 text-[11px] font-semibold text-text disabled:opacity-40"
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => !ninguna && props.onToggle('ninguna', false)}
            disabled={props.deshabilitado}
            aria-label="Desactivar todas las herramientas"
            className="h-7 rounded-blob px-2 text-[11px] font-semibold text-text disabled:opacity-40"
          >
            Ninguna
          </button>
        </span>
      </div>
      <ul>
        {HERRAMIENTAS_MCP.map((tool) => (
          <li key={tool.name}>
            <Interruptor
              etiqueta={`${tool.name} (${DESC_CORTA[tool.name] ?? tool.description})`}
              activo={activos.includes(tool.name)}
              deshabilitado={props.deshabilitado}
              onChange={(activo) => props.onToggle(tool.name, activo)}
            />
          </li>
        ))}
      </ul>
      {ninguna ? (
        <p role="status" className="text-[12px] text-danger">
          Sin herramientas: el conector no podra hacer nada (bloquea TODO).
        </p>
      ) : null}
    </div>
  );
}
