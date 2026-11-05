'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/browser';
import SeccionAjustes from './SeccionAjustes';
import ChipEstado from './ChipEstado';
import ConfirmInline from './ConfirmInline';
import FormContrasena from './FormContrasena';

/** Cuenta: identidad, cambio de contrasena y cierre de sesion */
export default function AjustesCuenta(props: { email?: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  async function cerrarSesion() {
    if (saliendo) return;
    setSaliendo(true);
    try {
      await createClient().auth.signOut();
    } catch {
      /* si falla la red, igual volvemos al login */
    }
    router.replace('/login');
  }

  return (
    <SeccionAjustes id="cuenta" titulo="Cuenta" descripcion="Tu identidad y el acceso a Mente.">
      <div className="space-y-4">
        <div>
          <p className="text-[13px] font-semibold text-text-soft">Correo</p>
          <p className="mt-1 break-all text-[15px] text-text">
            {props.email ?? 'Sesion iniciada'}
          </p>
          <div className="mt-2">
            <ChipEstado tono="ok">Sesion iniciada</ChipEstado>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <button
            type="button"
            aria-expanded={abierto}
            aria-controls="form-contrasena"
            onClick={() => setAbierto((valor) => !valor)}
            className="h-11 rounded-xl border border-[var(--border-control)] px-4 text-[13px] font-semibold text-text"
          >
            {abierto ? 'Ocultar cambio de contrasena' : 'Cambiar contrasena'}
          </button>
          <div id="form-contrasena" hidden={!abierto}>
            {abierto ? <FormContrasena /> : null}
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <ConfirmInline
            etiqueta="Cerrar sesion"
            confirmacion="Seguro? Toca de nuevo"
            disabled={saliendo}
            onConfirmar={() => void cerrarSesion()}
            className="h-11 rounded-xl border border-[var(--danger)] px-4 text-[13px] font-semibold text-danger disabled:opacity-50"
          />
        </div>
      </div>
    </SeccionAjustes>
  );
}
