'use client';

import { useState, type FormEvent } from 'react';
import type { EstadoCredencial } from '@/lib/ai/credenciales';
import type { ProveedorIa } from '@/lib/ai/provider';
import ConfirmInline from './ConfirmInline';

const NOMBRE: Record<ProveedorIa, string> = { openrouter: 'OpenRouter', openai: 'OpenAI' };
const PLACEHOLDER: Record<ProveedorIa, string> = {
  openrouter: 'sk-or-v1-...',
  openai: 'sk-...'
};

type Envio = 'idle' | 'guardando' | 'ok' | 'error';
type Respuesta = (EstadoCredencial & { error?: string }) | null;

/** formulario de clave AI: valida, cifra en el servidor y nunca la rellena */
export default function FormularioCredencialAi(props: { inicial: EstadoCredencial }) {
  const [estado, setEstado] = useState<EstadoCredencial>(props.inicial);
  const [proveedor, setProveedor] = useState<ProveedorIa>(props.inicial.proveedor ?? 'openrouter');
  const [clave, setClave] = useState('');
  const [envio, setEnvio] = useState<Envio>('idle');
  const [aviso, setAviso] = useState<{ tono: 'ok' | 'error'; texto: string } | null>(null);

  const origen =
    estado.origen === 'usuario'
      ? `Tu clave (${NOMBRE[estado.proveedor ?? 'openrouter']}${
          estado.last4 ? ` ····${estado.last4}` : ''
        })`
      : estado.origen === 'entorno'
        ? 'Clave del servidor'
        : null;

  async function enviar(metodo: 'PUT' | 'DELETE') {
    if (envio === 'guardando') return;
    setEnvio('guardando');
    setAviso(null);
    try {
      const res = await fetch('/api/ajustes/ai', {
        method: metodo,
        headers: metodo === 'PUT' ? { 'Content-Type': 'application/json' } : undefined,
        body: metodo === 'PUT' ? JSON.stringify({ proveedor, apiKey: clave }) : undefined
      });
      const data = (await res.json().catch(() => null)) as Respuesta;
      if (!res.ok || !data) throw new Error(data?.error ?? 'No se pudo completar la operacion.');
      setEstado(data);
      if (data.proveedor) setProveedor(data.proveedor);
      setClave('');
      setEnvio('ok');
      setAviso({ tono: 'ok', texto: metodo === 'PUT' ? 'Clave guardada.' : 'Clave eliminada.' });
    } catch (error: unknown) {
      setEnvio('error');
      setAviso({
        tono: 'error',
        texto: error instanceof Error ? error.message : 'No se pudo completar la operacion.'
      });
    }
  }

  function alGuardar(evento: FormEvent) {
    evento.preventDefault();
    void enviar('PUT');
  }

  return (
    <form onSubmit={alGuardar} className="space-y-3">
      {origen ? <p className="text-[13px] text-text-soft">{origen}</p> : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-col gap-1">
          <span className="text-[13px] text-text-soft">Proveedor</span>
          <select
            value={proveedor}
            onChange={(e) => setProveedor(e.target.value as ProveedorIa)}
            className="h-11 rounded-xl border border-[var(--border-control)] bg-surface px-3 text-[13px] text-text"
          >
            <option value="openrouter">OpenRouter</option>
            <option value="openai">OpenAI</option>
          </select>
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[13px] text-text-soft">Clave</span>
          <input
            type="password"
            value={clave}
            autoComplete="new-password"
            spellCheck={false}
            onChange={(e) => setClave(e.target.value)}
            placeholder={PLACEHOLDER[proveedor]}
            className="h-11 w-full rounded-xl border border-[var(--border-control)] bg-surface px-3 text-[13px] text-text"
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={envio === 'guardando' || clave.trim().length === 0}
          className="h-11 rounded-xl bg-[var(--accent-strong)] px-4 text-[13px] font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {envio === 'guardando' ? 'Guardando...' : 'Guardar clave'}
        </button>
        {estado.origen === 'usuario' ? (
          <ConfirmInline
            etiqueta="Eliminar clave"
            confirmacion="Confirmar borrado"
            onConfirmar={() => void enviar('DELETE')}
            disabled={envio === 'guardando'}
          />
        ) : null}
      </div>
      {aviso ? (
        <p
          role="status"
          aria-live="polite"
          className={aviso.tono === 'ok' ? 'text-[13px] text-text' : 'text-[13px] text-danger'}
        >
          {aviso.texto}
        </p>
      ) : null}
    </form>
  );
}
