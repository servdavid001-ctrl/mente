'use client';

import AppShell from '../AppShell';
import AjustesPerfil from './AjustesPerfil';
import AjustesCuenta from './AjustesCuenta';
import AjustesApariencia from './AjustesApariencia';
import AjustesExtension from './AjustesExtension';
import SeccionAjustes from './SeccionAjustes';
import ChipEstado from './ChipEstado';
import AjustesAgentes from './AjustesAgentes';
import AjustesApp from './AjustesApp';
import AjustesAI from './AjustesAI';
import AjustesDatos from './AjustesDatos';
import AjustesAcerca from './AjustesAcerca';
import AjustesCerrarSesion from './AjustesCerrarSesion';
import type { EstadoCredencial } from '@/lib/ai/credenciales';

type PropsPerfil = { uid: string; nombre?: string | null; fotoExt?: string | null };

/** panel /ajustes (paso 3): perfil primero, ajustes existentes y cerrar sesion al final */
export default function Ajustes(props: {
  email?: string;
  aiEstado: EstadoCredencial;
  perfil: PropsPerfil;
}) {
  return (
    <AppShell activeTab="ajustes" titulo="Ajustes" email={props.email}>
      <div className="mx-auto w-full max-w-[48rem]">
        <h1 className="font-display text-[28px] font-semibold leading-tight md:text-[32px] lg:text-[36px]">
          Ajustes
        </h1>
        <p className="mt-2 text-[15px] text-text-soft">Tu cuenta, tu app, tus datos.</p>

        <div className="mt-6 space-y-4 md:space-y-5">
          <AjustesPerfil {...props.perfil} email={props.email} />
          <AjustesCuenta />
          <AjustesApariencia />
          <AjustesExtension />
          <SeccionAjustes
            id="agentes"
            titulo="Acceso para agentes"
            descripcion="Tokens revocables para que los workers lean y dejen contenido en Mente."
            chip={<ChipEstado>Lectura + creacion</ChipEstado>}
          >
            <AjustesAgentes />
          </SeccionAjustes>
          <AjustesApp />
          <AjustesAI estado={props.aiEstado} />
          <AjustesDatos />
          <AjustesAcerca />
          <AjustesCerrarSesion />
        </div>
      </div>
    </AppShell>
  );
}
