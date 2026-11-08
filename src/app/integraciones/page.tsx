import type { Metadata } from 'next';
import Autoriza from '@/components/integraciones/Autoriza';
import TablaTools from '@/components/integraciones/TablaTools';
import EjemplosConfig from '@/components/integraciones/EjemplosConfig';
import Cierre from '@/components/integraciones/Cierre';

export const metadata: Metadata = {
  title: 'Integraciones y MCP — Mente',
  description:
    'Como conectar cualquier herramienta externa con AI a Mente: servidor MCP HTTP, tokens de conector y permisos por herramienta.'
};

/** modulo 19: documentacion publica (v1), SSR estatico sin auth. El proxy
 * excluye /integraciones del guard de sesion. Contenido espejo del repo en
 * docs/INTEGRACIONES.md (mismo texto). */

export default function PaginaIntegraciones() {
  return (
    <main className="mx-auto w-full max-w-[48rem] bg-bg px-6 py-10">
      <p className="font-display text-2xl font-semibold lowercase tracking-tight">
        mente<span className="text-accent">.</span>
      </p>
      <h1 className="mt-6 font-display text-[28px] font-semibold leading-tight md:text-[32px]">
        Integraciones y MCP
      </h1>
      <p className="mt-2 text-[15px] text-text-soft">
        Documentacion abierta v1: cualquier herramienta externa con AI puede entrar y
        trabajar con tu Mente. Lectura, creacion y cierre de tareas; nada destructivo.
      </p>

      <div className="mt-6 space-y-3 md:space-y-4">
        <Autoriza />
        <TablaTools />
        <EjemplosConfig />
        <Cierre />
      </div>
    </main>
  );
}
