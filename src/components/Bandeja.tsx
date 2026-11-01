'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AppShell from './AppShell';
import CaptureBar from './CaptureBar';
import InboxList from './InboxList';
import UndoPrompt, { type Undo } from './UndoPrompt';
import CategorizarSheet from './biblioteca/CategorizarSheet';
import { guardarCategorizacion, quitarDeBiblioteca } from './bandeja/useCategorizar';
import { ideaToPayload, optimisticIdea } from '@/lib/ideas';
import type { Coleccion, Idea, IdeaPayload } from '@/lib/types';

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
  const h = {
    setIdeas,
    setColecciones,
    toast: (m: string) => setToast(m)
  };

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
      setIdeas(((await rLista.json()) as { ideas: Idea[] }).ideas);
      setArchivadas(((await rArchivo.json()) as { ideas: Idea[] }).ideas);
      if (rCol.ok) {
        setColecciones(((await rCol.json()) as { colecciones: Coleccion[] }).colecciones);
      }
    } catch (e: unknown) {
      void e;
      setError(ERROR_CARGA);
    } finally {
      setCargando(false);
    }
  }, []);

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
          onCategorizar={(id) => setSheetId(id)}
        />
      </div>
      {ideaSheet ? (
        <CategorizarSheet
          ideaPreview={preview(ideaSheet)}
          colecciones={colecciones}
          yaCategorizada={ideaSheet.categorized}
          ocupado={sheetOcupado}
          onSave={async (payload) => {
            setSheetOcupado(true);
            const ok = await guardarCategorizacion(ideaSheet.id, payload, h);
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
