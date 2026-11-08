'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/browser';
import SeccionAjustes from './SeccionAjustes';
import PerfilFoto from './PerfilFoto';

function traducirError(mensaje: string): string {
  const texto = mensaje.toLowerCase();
  if (texto.includes('session') || texto.includes('not authenticated')) {
    return 'Tu sesion caduco. Vuelve a entrar.';
  }
  return 'No se pudo guardar. Reintenta.';
}

/** Perfil (paso 3 del rediseno): nombre editable, foto y correo solo lectura.
 * Nombre y foto_ext viven en user_metadata; la sidebar (paso 2) los lee. */
export default function AjustesPerfil(props: {
  uid: string;
  nombre?: string | null;
  fotoExt?: string | null;
  email?: string;
}) {
  const [nombre, setNombre] = useState(props.nombre ?? '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault();
    const valor = nombre.trim();
    if (!valor || guardando) return;
    setGuardando(true);
    setError(null);
    setExito(false);
    try {
      const { error: err } = await createClient().auth.updateUser({ data: { nombre: valor } });
      if (err) throw err;
      setExito(true);
    } catch (err: unknown) {
      setError(traducirError(err instanceof Error ? err.message : ''));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <SeccionAjustes
      id="perfil"
      titulo="Perfil"
      descripcion="Tu nombre y tu foto. Se ven en la barra lateral."
    >
      <div className="space-y-4">
        <div>
          <p className="text-[13px] font-semibold text-text-soft">Correo</p>
          <p className="mt-1 break-all text-[15px] text-text">{props.email ?? 'Sesion iniciada'}</p>
          <p className="mt-1 text-[12px] text-text-soft">El correo no se puede cambiar.</p>
        </div>

        <form onSubmit={(e) => void guardar(e)} className="border-t border-border pt-4" noValidate>
          <label className="block" htmlFor="perfil-nombre">
            <span className="text-[13px] text-text-soft">Nombre</span>
            <input
              id="perfil-nombre"
              type="text"
              autoComplete="name"
              maxLength={60}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-[var(--border-control)] bg-surface px-3 text-text"
            />
          </label>
          {exito ? (
            <p role="status" className="mt-2 text-[13px] text-text">
              Guardado
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="mt-2 text-[13px] text-danger">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={guardando || !nombre.trim()}
            className="mt-2 h-11 rounded-xl bg-[var(--accent-strong)] px-4 text-[13px] font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar nombre'}
          </button>
        </form>

        <div className="border-t border-border pt-4">
          <PerfilFoto uid={props.uid} fotoExt={props.fotoExt} email={props.email} />
        </div>
      </div>
    </SeccionAjustes>
  );
}
