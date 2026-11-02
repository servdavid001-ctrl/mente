'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AppShell from './AppShell';
import CaptureBar from './CaptureBar';
import InboxList from './InboxList';
import UndoPrompt, { type Undo } from './UndoPrompt';
import CategorizarSheet, { type SugerenciaSheet } from './biblioteca/CategorizarSheet';
import { guardarCategorizacion, quitarDeBiblioteca } from './bandeja/useCategorizar';
import { ideaToPayload, optimisticIdea } from '@/lib/ideas';
import type { ChipSugerenciaUI, Coleccion, Idea, IdeaPayload } from '@/lib/types';
import { cambiarSugerencia, cargarSugerencias, pedirSugerencia, type EstadoPedido } from './ai/cliente';

const ERROR_CARGA = 'No se pudieron cargar tus ideas. Reintenta';
const ERROR_ENVIO = 'No se pudo guardar. Tu idea sigue aqui, solo reintenta.';
const ERROR_ACCION = 'No se pudo completar la accion. Reintenta.';

export default function Bandeja() {
  const ops = useRef<Map<string, Promise<boolean>>>(new Map());
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [archivadas, setArchivadas] = useState<Idea[]>([]);
  const [colecciones, setColecciones] = useState<Coleccion[]>([]);
  const [verArchivadas, setVerArchivadas] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [toast, setToast] = useState<string | null>(null);
  const [undo, setUndo] = useState<Undo | null>(null);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [sheetOcupado, setSheetOcupado] = useState(false);
  // AI modulo 3: chips de sugerencia + pedir sugerencia + banner primer uso
  const [chips, setChips] = useState<ChipSugerenciaUI[]>([]);
  const [pedirEstados, setPedirEstados] = useState<Record<string, EstadoPedido>>({});
  const [sheetSug, setSheetSug] = useState<SugerenciaSheet | null>(null);
  const [bannerAI, setBannerAI] = useState(
    () => typeof window === 'undefined' || window.localStorage.getItem('mente-ai-banner') !== 'visto'
  );
  const h = {
    setIdeas,
    setColecciones,
    toast: (m: string) => setToast(m)
  };

  /** chips tipo categoria pendientes mapeadas contra colecciones conocidas */
  const refrescarChips = useCallback(
    async (ideas: Idea[], cols: Coleccion[]) => {
      const brutos = await cargarSugerencias(ideas.filter((i) => !i.categorized).map((i) => i.id));
      setChips(aChips(brutos, cols));
    },
    []
  );

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(undefined);
    try {
      const [rLista, rArchivo, rCol] = await Promise.all([
        fetch('/api/ideas'),
        fetch('/api/ideas?archivadas=1'),
        fetch('/api/colecciones')
      ]);
      if (!rLista.ok || !rArchivo.ok) throw new Error('fallo lista');
      const lista: Idea[] = ((await rLista.json()) as { ideas: Idea[] }).ideas;
      setIdeas(lista);
      setArchivadas(((await rArchivo.json()) as { ideas: Idea[] }).ideas);
      if (rCol.ok) {
        const cols = ((await rCol.json()) as { colecciones: Coleccion[] }).colecciones;
        setColecciones(cols);
        void refrescarChips(lista, cols);
      }
    } catch (e: unknown) {
      void e;
      setError(ERROR_CARGA);
    } finally {
      setCargando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refrescarChips]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function enviarIdea(payload: IdeaPayload) {
    const temp = optimisticIdea(payload.kind, payload.text, payload.sourceUrl);
    setIdeas((prev) => [temp, ...prev]);
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('fallo guardar');
      const json = (await res.json()) as { idea: Idea };
      setIdeas((prev) => prev.map((i) => (i.id === temp.id ? json.idea : i)));
      navigator.vibrate?.(10);
      // AI (spec 12): el analisis del link se dispara tras la captura; el chip
      // llega cuando la sugerencia aparece. Errores silenciosos: nada obligatorio.
      if (payload.kind === 'link') {
        setPedirEstados((prev) => ({ ...prev, [json.idea.id]: 'loading' }));
        const estado = await pedirSugerencia(json.idea.id);
        setPedirEstados((prev) => ({ ...prev, [json.idea.id]: estado }));
        await refrescarChips(json.idea ? [json.idea] : [], colecciones);
        if (estado === 'quieto') {
          setPedirEstados((prev) => {
            const sinIt = { ...prev };
            delete sinIt[json.idea.id];
            return sinIt;
          });
        }
      }
    } catch (e: unknown) {
      setIdeas((prev) => prev.filter((i) => i.id !== temp.id));
      setToast(ERROR_ENVIO);
      throw e; // CaptureBar conserva el texto si onSend rechaza
    }
  }

  async function archivar(id: string) {
    const idea = [...ideas, ...archivadas].find((i) => i.id === id);
    if (!idea || ops.current.has(id)) return;
    if (verArchivadas) {
      // archivadas -> QUitar el archivo (reversible, sin confirmacion)
      setArchivadas((prev) => prev.filter((i) => i.id !== id));
      await operarEn(ideas, id, { archivada: false });
      return;
    }
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    setUndo({ tipo: 'archivar', texto: 'Idea archivada', idea, pendiente: true });
    await operar(id, async () => {
      const res = await fetch(`/api/ideas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivada: true })
      });
      return res.ok;
    }, idea);
  }

  async function eliminar(id: string) {
    const idea = [...ideas, ...archivadas].find((i) => i.id === id);
    if (!idea || ops.current.has(id)) return;
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    setUndo({ tipo: 'eliminar', texto: 'Idea eliminada', idea, pendiente: true });
    await operar(id, async () => (await fetch(`/api/ideas/${id}`, { method: 'DELETE' })).ok, idea);
  }

  async function operarEn(lista: Idea[], id: string, cambio: Record<string, unknown>) {
    const enVista = lista.some((i) => i.id === id);
    if (enVista) setIdeas((prev) => prev.filter((i) => i.id !== id));
    const res = await fetch(`/api/ideas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cambio)
    });
    if (!res.ok) setToast(ERROR_ACCION);
  }

  async function operar(id: string, peticion: () => Promise<boolean>, idea: Idea) {
    const op = (async () => {
      if (await peticion()) {
        setUndo((actual) => (actual !== null && actual.idea.id === id ? { ...actual, pendiente: false } : actual));
        return true;
      }
      setUndo((actual) => (actual !== null && actual.idea.id === id ? null : actual));
      setIdeas((prev) => (prev.some((i) => i.id === id) ? prev : insertarOrdenado(prev, idea)));
      setToast(ERROR_ACCION);
      return false;
    })();
    ops.current.set(id, op);
    try {
      await op;
    } finally {
      ops.current.delete(id);
    }
  }

  async function deshacer(guardado: Undo) {
    setUndo(null);
    const idea = guardado.idea;
    const opEnCurso = ops.current.get(idea.id);
    if (opEnCurso && !(await opEnCurso)) return; // op fallo: item ya restaurado
    if (guardado.tipo === 'archivar') {
      const res = await fetch(`/api/ideas/${idea.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivada: false })
      });
      if (!res.ok) {
        setToast(ERROR_ACCION);
        return;
      }
      setIdeas((prev) => (prev.some((i) => i.id === idea.id) ? prev : insertarOrdenado(prev, idea)));
      return;
    }
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ideaToPayload(idea))
      });
      if (!res.ok) throw new Error('fallo restaurar');
      const json = (await res.json()) as { idea: Idea };
      setIdeas((prev) => insertarOrdenado(prev, json.idea));
    } catch (e: unknown) {
      void e;
      setToast(ERROR_ACCION);
    }
  }

  const ideaSheet = ideas.find((i) => i.id === sheetId);

  /** descarta la sugerencia del chip (reversible): el item vuelve a ✗ simple */
  async function descartarSugerencia(sugerenciaId: string) {
    const ok = await cambiarSugerencia(sugerenciaId, 'descartar');
    if (!ok) setToast(ERROR_ACCION);
    setChips((prev) => prev.filter((c) => c.sugerenciaId !== sugerenciaId));
  }

  /** pedir sugerencia manual (spec 14: solo items sin categorizar) */
  async function pedirManual(ideaId: string) {
    if (pedirEstados[ideaId] === 'loading') return;
    setPedirEstados((prev) => ({ ...prev, [ideaId]: 'loading' }));
    const estado = await pedirSugerencia(ideaId);
    setPedirEstados((prev) => ({ ...prev, [ideaId]: estado }));
    await refrescarChips(ideas, colecciones);
    if (estado === 'quieto') {
      setPedirEstados((prev) => {
        const sinIt = { ...prev };
        delete sinIt[ideaId];
        return sinIt;
      });
    }
  }
  const barraCaptura = (
    <div className="space-y-1.5">
      {undo ? (
        <UndoPrompt
          activo={undo}
          onDeshacer={() => void deshacer(undo)}
          onCerrar={() => setUndo(null)}
        />
      ) : null}
      {toast ? (
        <p role="alert" className="rounded-card bg-danger px-4 py-2.5 text-sm text-white">
          {toast}
        </p>
      ) : null}
      <CaptureBar onSend={enviarIdea} />
    </div>
  );

  return (
    <AppShell activeTab="bandeja" captureBar={barraCaptura}>
      <div className="space-y-2">
        {bannerAI ? (
          <div
            role="status"
            className="flex items-center gap-2 rounded-card bg-accent-soft px-4 py-2.5 text-[13px] text-text"
          >
            <span aria-hidden="true" className="text-accent">✦</span>
            <span>Antes de asombrarte, tu AI lee tu biblioteca. Nada se aplica sin tu toque.</span>
            <button
              type="button"
              aria-label="Cerrar el aviso de la AI"
              onClick={() => {
                setBannerAI(false);
                try {
                  window.localStorage.setItem('mente-ai-banner', 'visto');
                } catch {
                  /* storage bloqueada: el banner solo se oculta esta vez */
                }
              }}
              className="ml-auto flex h-11 w-11 items-center justify-center text-text-soft"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        ) : null}
        {!error && !cargando ? (
          <div className="flex justify-end">
            <button
              type="button"
              aria-expanded={verArchivadas}
              onClick={() => setVerArchivadas((v) => !v)}
              className="min-h-11 py-2 text-[13px] text-text-soft"
            >
              {verArchivadas ? 'Ocultar archivadas' : `Ver archivadas (${archivadas.length})`}
            </button>
          </div>
        ) : null}
        <InboxList
          ideas={verArchivadas ? archivadas : ideas}
          isLoading={cargando}
          error={error}
          onRetry={() => void cargar()}
          colecciones={colecciones}
          conChipArchivada={verArchivadas}
          onArchive={(id) => void archivar(id)}
          onDelete={(id) => void eliminar(id)}
          onCategorizar={(id) => {
            setSheetSug(null);
            setSheetId(id);
          }}
          ai={{
            chips,
            pedirEstado: pedirEstados,
            onAbrirChipSugerencia: (ideaId) => {
              const chip = chips.find((c) => c.ideaId === ideaId);
              setSheetSug(
                chip
                  ? {
                      sugerenciaId: chip.sugerenciaId,
                      ideaId,
                      coleccionId: chip.coleccionId,
                      nombreColeccion: chip.nombreColeccion,
                      esNueva: chip.esNueva,
                      dotColor: chip.dotColor
                    }
                  : null
              );
              setSheetId(ideaId);
            },
            onDescartarSugerencia: (sugerenciaId) => void descartarSugerencia(sugerenciaId),
            onPedirSugerencia: (ideaId) => void pedirManual(ideaId)
          }}
        />
      </div>
      {ideaSheet ? (
        <CategorizarSheet
          ideaPreview={preview(ideaSheet)}
          colecciones={colecciones}
          yaCategorizada={ideaSheet.categorized}
          ocupado={sheetOcupado}
          sugerencia={
            (() => {
              const chip = chips.find((c) => c.ideaId === ideaSheet.id);
              return chip
                ? {
                    sugerenciaId: chip.sugerenciaId,
                    ideaId: ideaSheet.id,
                    coleccionId: chip.coleccionId,
                    nombreColeccion: chip.nombreColeccion,
                    esNueva: chip.esNueva,
                    dotColor: chip.dotColor
                  }
                : undefined;
            })()
          }
          onDescartarParaSiempre={async () => {
            if (!sheetSug) return;
            await cambiarSugerencia(sheetSug.sugerenciaId, 'descartar_permanente');
            setChips((prev) => prev.filter((c) => c.sugerenciaId !== sheetSug.sugerenciaId));
          }}
          onSave={async (payload) => {
            setSheetOcupado(true);
            const ok = await guardarCategorizacion(ideaSheet.id, payload, h);
            if (ok && sheetSug?.ideaId === ideaSheet.id) {
              // la categoria se confirma con el guardado del sheet (spec 13)
              await cambiarSugerencia(sheetSug.sugerenciaId, 'aceptar');
              setChips((prev) => prev.filter((c) => c.ideaId !== ideaSheet.id));
            }
            setSheetOcupado(false);
            if (ok) setSheetId(null);
          }}
          onQuitar={async () => {
            setSheetOcupado(true);
            const ok = await quitarDeBiblioteca(ideaSheet.id, h);
            setSheetOcupado(false);
            if (ok) setSheetId(null);
          }}
          onCerrar={() => setSheetId(null)}
        />
      ) : null}
    </AppShell>
  );
}

function preview(idea: Idea): string {
  if (idea.kind === 'link') return idea.sourceUrl ?? '';
  if (idea.kind === 'arte') return idea.mediaUrl ? 'Con imagen' : 'Arte';
  return idea.text || 'Nota de voz';
}

function insertarOrdenado(lista: Idea[], idea: Idea): Idea[] {
  return [...lista, idea].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/* glue AI (modulo 3) */

/** sugerencias tipo categoria pendientes -> chips (resuelve nombre vs
 * colecciones conocidas; esNueva cuando no existe la coleccion) */
function aChips(
  brutos: Array<{ id: string; ideaId: string; tipo: string; payload: Record<string, unknown>; estado: string }>,
  cols: Coleccion[]
): ChipSugerenciaUI[] {
  const chips: ChipSugerenciaUI[] = [];
  for (const s of brutos) {
    if (s.tipo !== 'categoria' || s.estado !== 'pendiente') continue;
    const nombre = String(s.payload.nombreColeccion ?? '').trim();
    if (!nombre) continue;
    const existente = cols.find((c) => c.nombre.toLowerCase() === nombre.toLowerCase());
    chips.push({
      sugerenciaId: s.id,
      ideaId: s.ideaId,
      nombreColeccion: nombre,
      esNueva: !existente,
      dotColor: existente?.color,
      coleccionId: existente?.id
    });
  }
  return chips;
}

/** el chip abierto en el sheet: la sugerencia pre-enrutada completa */
