'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/browser';

const MINIMO = 12;

function traducirError(mensaje: string): string {
  const texto = mensaje.toLowerCase();
  if (texto.includes('different from the old')) {
    return 'La contrasena nueva debe ser distinta de la actual.';
  }
  if (texto.includes('at least') || texto.includes('password should be')) {
    return 'La contrasena no cumple el minimo de 12 caracteres.';
  }
  if (texto.includes('session') || texto.includes('not authenticated')) {
    return 'Tu sesion caduco. Vuelve a entrar.';
  }
  return 'No se pudo guardar. Reintenta.';
}

/** formulario de cambio de contrasena (minimo 12, repetida) */
export default function FormContrasena() {
  const [nueva, setNueva] = useState('');
  const [repetir, setRepetir] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const valida = nueva.length >= MINIMO && nueva === repetir;

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!valida || guardando) return;
    setGuardando(true);
    setError(null);
    setExito(null);
    try {
      const { error: err } = await createClient().auth.updateUser({ password: nueva });
      if (err) throw err;
      setNueva('');
      setRepetir('');
      setExito('Contrasena actualizada.');
    } catch (err: unknown) {
      setError(traducirError(err instanceof Error ? err.message : ''));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={(e) => void guardar(e)} className="mt-3 space-y-3" noValidate>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-[13px] text-text-soft">Contrasena nueva</span>
          <input
            type="password"
            required
            minLength={MINIMO}
            autoComplete="new-password"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            aria-describedby="ayuda-contrasena"
            className="mt-1 h-11 w-full rounded-xl border border-[var(--border-control)] bg-surface px-3 text-text"
          />
        </label>
        <label className="block">
          <span className="text-[13px] text-text-soft">Repite la contrasena</span>
          <input
            type="password"
            required
            minLength={MINIMO}
            autoComplete="new-password"
            value={repetir}
            onChange={(e) => setRepetir(e.target.value)}
            aria-describedby="ayuda-contrasena"
            className="mt-1 h-11 w-full rounded-xl border border-[var(--border-control)] bg-surface px-3 text-text"
          />
        </label>
      </div>
      <p id="ayuda-contrasena" className="text-[12px] text-text-soft">
        Minimo 12 caracteres. Si no coincide, no se guarda.
      </p>
      {error ? (
        <p role="alert" className="text-[13px] text-danger">
          {error}
        </p>
      ) : null}
      {exito ? (
        <p role="status" className="text-[13px] text-text">
          {exito}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={!valida || guardando}
        className="h-11 rounded-xl bg-[var(--accent-strong)] px-4 text-[13px] font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        {guardando ? 'Guardando...' : 'Guardar contrasena'}
      </button>
    </form>
  );
}
