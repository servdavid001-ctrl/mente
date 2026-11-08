'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/browser';
import SeccionAjustes from './SeccionAjustes';
import ConfirmInline from './ConfirmInline';

/** Cerrar sesion: seccion final de /ajustes (paso 3). Mismo comportamiento
 * que tenia el boton de la sidebar: signOut + redirect a /login. */
export default function AjustesCerrarSesion() {
  const router = useRouter();
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
    <SeccionAjustes
      id="cerrar-sesion"
      titulo="Cerrar sesion"
      descripcion="Cierra tu sesion en este dispositivo."
    >
      <ConfirmInline
        etiqueta="Cerrar sesion"
        confirmacion="Seguro? Toca de nuevo"
        disabled={saliendo}
        onConfirmar={() => void cerrarSesion()}
        className="h-11 rounded-xl border border-[var(--danger)] px-4 text-[13px] font-semibold text-danger disabled:opacity-50"
      />
    </SeccionAjustes>
  );
}
