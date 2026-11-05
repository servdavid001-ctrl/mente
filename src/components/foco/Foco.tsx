'use client';

import AppShell from '../AppShell';
import EmptyState from '../EmptyState';
import MetricasFoco from './MetricasFoco';
import Guardian from './Guardian';
import Hoy from './Hoy';
import ListaProyectos from './ListaProyectos';
import CrearProyectoInline from './CrearProyectoInline';
import Copiloto from './Copiloto';
import ExtensionCard from './ExtensionCard';
import { useFoco } from './useFoco';
import { mensajeGuardian } from '@/lib/foco';

export default function Foco() {
  const foco = useFoco();
  const desplegados = foco.proyectos.filter((p) => !p.plegado);
  const plegados = foco.proyectos.filter((p) => p.plegado);
  const objetivosActivos = foco.objetivos.filter((o) => o.estado === 'activo').length;

  return (
    <AppShell activeTab="foco" titulo="Foco">
      {foco.toast ? (
        <p role="alert" className="mb-3 rounded-card bg-danger px-4 py-2.5 text-sm text-white">
          {foco.toast}
        </p>
      ) : null}

      {foco.cargando ? <EsqueletoFoco /> : null}

      {!foco.cargando && foco.error ? (
        <div className="rounded-card bg-danger px-4 py-3 text-sm text-white">
          {foco.error}
          <button
            type="button"
            onClick={() => void foco.cargar()}
            className="ml-2 h-9 rounded-blob border border-white px-3 text-[13px] font-semibold"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {!foco.cargando && !foco.error ? (
        <div className="space-y-5">
          <MetricasFoco
            proyectosDesplegados={desplegados.length}
            objetivosActivos={objetivosActivos}
            ideasSinProyecto={foco.sinProyecto}
          />

          <Guardian mensaje={mensajeGuardian(foco.proyectos)} />

          <Hoy />

          {foco.proyectos.length === 0 ? (
            <EmptyState
              icon="target"
              title="Tu Foco empieza con un proyecto."
              description="Crea uno abajo y el panel te dira donde esta tu atencion."
            />
          ) : null}

          <ListaProyectos
            titulo="Desplegados"
            ariaLabel="Proyectos desplegados"
            proyectos={desplegados}
            ocupadoId={foco.ocupadoId}
            onToggle={(proyecto) => void foco.alternarPlegado(proyecto)}
          />

          <ListaProyectos
            titulo="Guardados"
            ariaLabel="Proyectos guardados"
            proyectos={plegados}
            ocupadoId={foco.ocupadoId}
            onToggle={(proyecto) => void foco.alternarPlegado(proyecto)}
          />

          <CrearProyectoInline onCrear={foco.crear} />

          <ExtensionCard />

          <Copiloto proyectos={foco.proyectos} onCreado={() => void foco.cargar(true)} />
        </div>
      ) : null}
    </AppShell>
  );
}

function EsqueletoFoco() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="anim-shimmer h-20 w-full rounded-card bg-gradient-to-r from-border via-surface to-border" />
      <div className="anim-shimmer h-16 w-full rounded-card bg-border" />
      <div className="anim-shimmer h-16 w-full rounded-card bg-border" />
    </div>
  );
}
