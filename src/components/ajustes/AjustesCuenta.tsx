'use client';

import { useState } from 'react';
import SeccionAjustes from './SeccionAjustes';
import FormContrasena from './FormContrasena';

/** Cuenta: identidad, cambio de contrasena y cierre de sesion.
 * Paso 3: el correo vive en Perfil y el cierre de sesion es la seccion final. */
export default function AjustesCuenta() {
  const [abierto, setAbierto] = useState(false);

  return (
    <SeccionAjustes id="cuenta" titulo="Cuenta" descripcion="Tu contrasena y el acceso a Mente.">
      <div className="space-y-4">
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
      </div>
    </SeccionAjustes>
  );
}
