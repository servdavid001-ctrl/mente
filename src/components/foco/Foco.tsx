'use client';

import { useState } from 'react';
import AppShell from '../AppShell';
import EmptyState from '../EmptyState';
import Copiloto from './Copiloto';
import MetricasFoco from './MetricasFoco';
import Guardian from './Guardian';
import Hoy from './Hoy';
import VistaTarjetas from './VistaTarjetas';
import ModalCrearProyecto from './ModalCrearProyecto';
import ModalPlegados from './ModalPlegados';
import BotonesFlotantes from './BotonesFlotantes';
import { useFoco } from './useFoco';
import { mensajeGuardian } from '@/lib/foco';

/** Foco v2 (modulo 11): vista de tarjetas (carrusel/grid), botones flotantes
 * "+"/"P" con modales y guardian suave. La Extension vive solo en /ajustes. */
export default function Foco(props: { email?: string }) {
  const foco = useFoco();
  const desplegados = foco.proyectos.filter((p) => !p.plegado);
  const plegados = foco.proyectos.filter((p) => p.plegado);
  const [modal, setModal] = useState<'crear' | 'plegados' | null>(null);

  async function crear(datos: { nombre: string; color: string; descripcion: string | null }) {
    await foco.crear(datos);
    setModal(null);
  }

  async function desplegar(proyecto: Parameters<typeof foco.alternarPlegado>[0]) {
    if (foco.ocupadoId !== null) return;
    setModal(null);
    await foco.alternarPlegado(proyecto);
  }

  return (
    <AppShell activeTab="foco" titulo="Foco" email={props.email}>
      <div className="mx-auto w-full max-w-[75rem] space-y-5 pb-28">
        {foco.cargando ? <EsqueletoFoco /> : <BannerAviso aviso={foco} />}

        {!foco.cargando && !foco.error ? (
          <>
            <Guardian mensaje={mensajeGuardian(foco.proyectos)} />
            <MetricasFoco
              proyectosDesplegados={desplegados.length}
              objetivosActivos={foco.objetivos.filter((o) => o.estado === 'activo').length}
              ideasSinProyecto={foco.sinProyecto}
            />
            {desplegados.length === 0 ? (
              <EmptyState
                icon="target"
                title="Tu Foco empieza con un proyecto."
                description="Usa el boton + para crear tu primer proyecto."
              />
            ) : null}
            <VistaTarjetas
              proyectos={desplegados}
              ocupadoId={foco.ocupadoId}
              onPlegar={(p) => void foco.alternarPlegado(p)}
            />
            <Hoy />
            <Copiloto proyectos={foco.proyectos} onCreado={() => void foco.cargar(true)} />
          </>
        ) : null}
      </div>

      {!foco.cargando ? (
        <BotonesFlotantes
          ocultos={plegados.length}
          ocupado={foco.ocupadoId !== null}
          onCrear={() => setModal('crear')}
          onPlegados={() => setModal('plegados')}
        />
      ) : null}

      {modal === 'crear' ? (
        <ModalCrearProyecto onCerrar={() => setModal(null)} onCrear={crear} />
      ) : null}
      {modal === 'plegados' ? (
        <ModalPlegados
          plegados={plegados}
          ocupadoId={foco.ocupadoId}
          onCerrar={() => setModal(null)}
          onDesplegar={(p) => void desplegar(p)}
        />
      ) : null}
    </AppShell>
  );
}

function BannerAviso(props: { aviso: ReturnType<typeof useFoco> }) {
  const { aviso } = props;
  if (aviso.error) {
    return (
      <div className="rounded-card bg-danger px-4 py-3 text-sm text-white">
        {aviso.error}
        <button
          type="button"
          onClick={() => void aviso.cargar()}
          className="ml-2 h-9 rounded-blob border border-white px-3 text-[13px] font-semibold"
        >
          Reintentar
        </button>
      </div>
    );
  }
  if (aviso.toast) {
    return (
      <p role="alert" className="rounded-card bg-danger px-4 py-2.5 text-sm text-white">
        {aviso.toast}
      </p>
    );
  }
  return null;
}

function EsqueletoFoco() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="anim-shimmer h-20 w-full rounded-card bg-gradient-to-r from-border via-surface to-border" />
      <div className="anim-shimmer h-44 w-full rounded-card bg-border" />
      <div className="anim-shimmer h-16 w-full rounded-card bg-border" />
    </div>
  );
}
