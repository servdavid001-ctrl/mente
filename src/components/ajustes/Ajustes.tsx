'use client';

import AppShell from '../AppShell';
import AjustesCuenta from './AjustesCuenta';
import AjustesApariencia from './AjustesApariencia';
import AjustesExtension from './AjustesExtension';
import AjustesApp from './AjustesApp';
import AjustesAI from './AjustesAI';
import AjustesDatos from './AjustesDatos';
import AjustesAcerca from './AjustesAcerca';

/** panel /ajustes: cuenta, apariencia, distribucion, AI, datos y acerca de */
export default function Ajustes(props: { email?: string; aiConfigurada: boolean }) {
  return (
    <AppShell activeTab="ajustes" titulo="Ajustes" email={props.email}>
      <div className="mx-auto w-full max-w-[48rem]">
        <h1 className="font-display text-[28px] font-semibold leading-tight md:text-[32px] lg:text-[36px]">
          Ajustes
        </h1>
        <p className="mt-2 text-[15px] text-text-soft">Tu cuenta, tu app, tus datos.</p>

        <div className="mt-6 space-y-4 md:space-y-5">
          <AjustesCuenta email={props.email} />
          <AjustesApariencia />
          <AjustesExtension />
          <AjustesApp />
          <AjustesAI configurada={props.aiConfigurada} />
          <AjustesDatos />
          <AjustesAcerca />
        </div>
      </div>
    </AppShell>
  );
}
