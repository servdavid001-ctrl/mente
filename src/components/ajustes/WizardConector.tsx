'use client';

import { useState } from 'react';
import VistaConector from './VistaConector';

const PRESETS = ['opencode', 'muse', 'grok'];
const ERROR = 'No se pudo crear el conector. Reintenta.';

/** wizard Añadir conector (modulo 19): nombre en un paso y sheet con TODO
 * (token + config + permisos activos). Reemplaza el camino manual 3 pasos. */
export default function WizardConector(props: {
  ocupado: boolean;
  permisosDe: (id: string) => string[];
  onCopiar: (token: string) => void;
  onToggle: (id: string, nombre: string, activo: boolean) => void;
  onCrear: (nombre: string) => Promise<{ id: string; token: string }>;
}) {
  const [abierto, setAbierto] = useState(false);
  const [custom, setCustom] = useState(false);
  const [nombre, setNombre] = useState('');
  const [creado, setCreado] = useState<{ id: string; token: string } | null>(null);
  const [error, setError] = useState(false);

  async function crear(nombreElegido: string) {
    setError(false);
    try {
      setCreado(await props.onCrear(nombreElegido));
    } catch {
      setError(true);
    }
  }

  function elegir(preset: string) {
    if (preset === 'custom') setCustom(true);
    else void crear(preset);
  }

  function enviar(event: React.FormEvent) {
    event.preventDefault();
    const limpio = nombre.trim();
    if (limpio.length > 0 && limpio.length <= 40) void crear(limpio);
  }

  function reiniciar() {
    setAbierto(false);
    setCustom(false);
    setNombre('');
    setCreado(null);
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="h-11 rounded-xl bg-[var(--accent-strong)] px-4 text-[13px] font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)]"
      >
        Añadir conector
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-card border border-border px-3 py-3">
      {creado ? (
        <>
          <VistaConector
            token={creado.token}
            conectorId={creado.id}
            permisos={props.permisosDe(creado.id)}
            onCopiar={props.onCopiar}
            onToggle={props.onToggle}
          />
          <button
            type="button"
            onClick={reiniciar}
            className="h-9 rounded-xl border border-[var(--border-control)] px-3 text-[12px] font-semibold text-text"
          >
            Listo
          </button>
        </>
      ) : (
        <>
          <p className="text-[13px] font-semibold text-text">Con quien se conecta?</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => elegir(preset)}
                disabled={props.ocupado}
                className="h-9 rounded-blob border border-[var(--border-control)] px-3 text-[13px] font-semibold text-text disabled:opacity-50"
              >
                {preset}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCustom(true)}
              disabled={props.ocupado}
              className="h-9 rounded-blob border border-[var(--border-control)] px-3 text-[13px] font-semibold text-text disabled:opacity-50"
            >
              Otro
            </button>
          </div>
          {custom ? (
            <form onSubmit={enviar} className="flex flex-wrap items-end gap-2">
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del conector"
                maxLength={40}
                aria-label="Nombre del conector"
                className="h-11 min-w-0 flex-1 rounded-card border border-border bg-surface px-3 text-[14px] text-text placeholder:text-text-soft"
              />
              <button
                type="submit"
                disabled={props.ocupado || nombre.trim().length === 0}
                className="h-11 shrink-0 rounded-xl bg-[var(--accent-strong)] px-4 text-[13px] font-semibold text-[var(--on-accent)] disabled:opacity-50"
              >
                Crear
              </button>
            </form>
          ) : null}
          {props.ocupado ? <p className="text-[12px] text-text-soft">Generando token...</p> : null}
          {error ? <p role="alert" className="text-[13px] text-danger">{ERROR}</p> : null}
        </>
      )}
    </div>
  );
}
