'use client';

import { useEffect, useRef, useState } from 'react';
import Pensando from '@/components/ai/Pensando';
import TranscripcionPanel from '@/components/ai/TranscripcionPanel';
import EntidadesTags from '@/components/ai/EntidadesTags';
import ConexionesPropuestas from '@/components/ai/ConexionesPropuestas';
import AccionMinuta from '@/components/ai/AccionMinuta';
import { cambiarSugerencia } from '@/components/ai/cliente';
import type { Conexion, Entidad, Idea, Sugerencia } from '@/lib/types';

/** Expansion semantica del detalle (spec modulo3 14): automatico y discreto
 * para links al abrir; bajo demanda para texto/voz (boton explicito: la
 * transcripcion es la accion con mas costo). Vive plegada. */
export default function ExpansionItem(props: {
  idea: Idea;
  conectadasYa: string[];
  onNuevaConexion: (conexion: Conexion) => void;
  onNotaAppend: (texto: string) => void;
}) {
  const [abierta, setAbierta] = useState(false);
  const [estado, setEstado] = useState<'quieto' | 'loading' | 'listo' | 'error' | 'rate'>('quieto');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [conexiones, setConexiones] = useState<Sugerencia[]>([]);
  const [minuta, setMinuta] = useState<Sugerencia | null>(null);
  const [transcripcion, setTranscripcion] = useState<string>(
    props.idea.transcripcion ?? ''
  );
  const [entidades, setEntidades] = useState<Entidad[]>(props.idea.entidades?.lista ?? []);
  const [minutaGuardada, setMinutaGuardada] = useState(props.idea.entidades?.ai_minuta ?? null);
  const lanzada = useRef(false);

  useEffect(() => {
    // auto al abrir SOLO para link sin transcripcion (data suggestion: 1 vez)
    if (props.idea.kind === 'link' && !props.idea.transcripcion && !lanzada.current) {
      lanzada.current = true;
      setAbierta(true);
      void analizar();
    }
    if (props.idea.transcripcion) setEstadoListoSilencioso();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setEstadoListoSilencioso() {
    setEstado('listo');
  }

  function ponerSugerencias(sugerencias: Sugerencia[]) {
    setConexiones(sugerencias.filter((s) => s.tipo === 'conexion' && s.estado === 'pendiente'));
    setMinuta(sugerencias.find((s) => s.tipo === 'minuta' && s.estado === 'pendiente') ?? null);
  }

  async function analizar() {
    setEstado('loading');
    try {
      const res = await fetch(`/api/ai/analizar/${props.idea.id}`, { method: 'POST' });
      if (res.status === 429) {
        setEstado('rate');
        return;
      }
      if (!res.ok) {
        setEstado('error');
        const json = (await res.json().catch(() => ({}))) as { error?: unknown };
        setMensaje(typeof json.error === 'string' ? json.error : null);
        return;
      }
      const json = (await res.json()) as {
        transcripcion?: string | null;
        entidades?: { lista?: Entidad[] };
        sugerencias?: Sugerencia[];
      };
      setTranscripcion(json.transcripcion ?? '');
      setEntidades(json.entidades?.lista ?? []);
      ponerSugerencias(json.sugerencias ?? []);
      setEstado('listo');
    } catch {
      setEstado('error');
    }
  }

  /** Aceptar = POST real /api/conexiones + estado 'aceptada' (spec 14.3) */
  async function aceptarConexion(haciaId: string, sugerenciaId: string) {
    try {
      const res = await fetch('/api/conexiones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ desdeId: props.idea.id, haciaId })
      });
      if (res.status === 409) {
        setConexiones((prev) => prev.filter((s) => s.id !== sugerenciaId));
        return;
      }
      if (!res.ok) return;
      const json = (await res.json()) as { conexion: Conexion };
      const okEstado = await cambiarSugerencia(sugerenciaId, 'aceptar');
      if (okEstado) {
        setConexiones((prev) => prev.filter((s) => s.id !== sugerenciaId));
        props.onNuevaConexion(json.conexion);
      }
    } catch {
      /* error queda fuera del bloque: la card persiste, reintento manual */
    }
  }

  async function descartarSugerencia(id: string) {
    await cambiarSugerencia(id, 'descartar');
    setConexiones((prev) => prev.filter((s) => s.id !== id));
  }

  /** minuta: PUT aceptar guarda ai_minuta (base del modulo 7) */
  async function convertirMinuta() {
    if (!minuta) return;
    const ok = await cambiarSugerencia(minuta.id, 'aceptar');
    if (!ok) return;
    const pasos = (minuta.payload as { pasos?: string[] })?.pasos ?? [];
    setMinutaGuardada({ pasos, guardada: new Date().toISOString() });
    setMinuta(null);
  }

  const hayContenido = abierta || estado === 'loading' || estado === 'rate' || estado === 'error';
  if (!hayContenido && props.idea.kind !== 'link') return null;
  if (props.idea.kind === 'link' && !hayContenido) return null;

  return (
    <section aria-label="Expansion de la AI" className="rounded-card border border-border bg-surface p-3">
      <button
        type="button"
        aria-expanded={abierta}
        aria-controls="expansion-cuerpo"
        onClick={() => setAbierta((a) => !a)}
        className="flex min-h-11 w-full items-center justify-between text-[13px] font-semibold text-text"
      >
        <span>
          <span aria-hidden="true" className="text-accent">✦ </span>
          Expansion
        </span>
        <span aria-hidden="true" className="text-text-soft">{abierta ? '▾' : '▸'}</span>
      </button>
      {abierta ? (
        <div id="expansion-cuerpo" className="mt-2 space-y-3">
          {estado === 'loading' ? <Pensando /> : null}
          {estado !== 'quieto' ? (
            <TranscripcionPanel
              estado={
                estado === 'loading'
                  ? 'loading'
                  : estado === 'listo'
                    ? transcripcion
                      ? 'listo'
                      : 'error'
                    : estado === 'rate'
                      ? 'rate'
                      : 'error'
              }
              texto={transcripcion || undefined}
              origen={props.idea.kind === 'voz' ? 'video' : 'articulo'}
              onAnalizar={() => void analizar()}
              onReintentar={() => void analizar()}
              onAniadirANota={(t) => props.onNotaAppend(t)}
            />
          ) : null}
          {mensaje && estado === 'error' ? (
            <p className="text-[13px] text-text-soft">{mensaje}</p>
          ) : null}

          <div>
            <p className="text-[13px] font-semibold text-text">Entidades detectadas</p>
            <div className="mt-1">
              <EntidadesTags entidades={entidades} />
            </div>
          </div>

          {conexiones.length > 0 ? (
            <ConexionesPropuestas
              sugerencias={conexiones}
              conectadasYa={props.conectadasYa}
              onAceptar={aceptarConexion}
              onDescartar={descartarSugerencia}
            />
          ) : null}

          {minuta && !minutaGuardada ? (
            <div className="flex items-center gap-2 rounded-card bg-accent-soft px-3 py-2">
              <p className="text-[13px] font-medium text-text">Esto puede convertirse en tareas</p>
              <button
                type="button"
                aria-label="Convertir este contenido en minuta de tareas"
                onClick={() => void convertirMinuta()}
                className="ml-auto h-8 rounded-full bg-accent px-4 text-[13px] font-semibold text-white"
              >
                Convertir ✦
              </button>
            </div>
          ) : null}
          {minutaGuardada ? (
            <AccionMinuta tituloItem={tituloDe(props.idea)} pasos={minutaGuardada.pasos} />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function tituloDe(idea: Pick<Idea, 'text' | 'kind' | 'sourceUrl'>): string {
  const primera = (idea.text || '').split('\n')[0].trim();
  if (primera) return primera;
  if (idea.kind === 'link') return idea.sourceUrl ?? 'Link';
  return idea.kind === 'voz' ? 'Nota de voz' : 'Arte';
}
