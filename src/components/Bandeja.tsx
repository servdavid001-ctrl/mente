'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AppShell from './AppShell';
import CaptureBar from './CaptureBar';
import InboxList from './InboxList';
import UndoPrompt, { type Undo } from './UndoPrompt';
import { ideaToPayload, optimisticIdea } from '@/lib/ideas';
import type { Idea, IdeaPayload } from '@/lib/types';

type RespuestaLista = { ideas: Idea[] };
type RespuestaIdea = { idea: Idea };

const ERROR_CARGA = 'No se pudieron cargar tus ideas. Reintenta';
const ERROR_ENVIO = 'No se pudo guardar. Tu idea sigue aqui, solo reintenta.';
const ERROR_ACCION = 'No se pudo completar la accion. Reintenta.';

export default function Bandeja() {
  /** op de fondo (archivar/eliminar) en vuelo por idea: el undo espera a que termine */
  const ops = useRef<Map<string, Promise<boolean>>>(new Map());
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [toast, setToast] = useState<string | null>(null);
  const [undo, setUndo] = useState<Undo | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(undefined);
    try {
      const res = await fetch('/api/ideas');
      if (!res.ok) throw new Error('fallo lista');
      const json = (await res.json()) as RespuestaLista;
      setIdeas(json.ideas);
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
      if (!res.ok) {
        const detalle = await detalleError(res);
        throw new Error(detalle ?? ERROR_ENVIO);
      }
      const json = (await res.json()) as RespuestaIdea;
      setIdeas((prev) => prev.map((i) => (i.id === temp.id ? json.idea : i)));
      navigator.vibrate?.(10);
    } catch (e: unknown) {
      setIdeas((prev) => prev.filter((i) => i.id !== temp.id));
      setToast(e instanceof Error && e.message ? e.message : ERROR_ENVIO);
      throw e; // CaptureBar conserva el texto si onSend rechaza
    }
  }

  async function archivar(id: string) {
    const idea = ideas.find((i) => i.id === id);
    if (!idea || ops.current.has(id)) return;
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
    const idea = ideas.find((i) => i.id === id);
    if (!idea || ops.current.has(id)) return;
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    setUndo({ tipo: 'eliminar', texto: 'Idea eliminada', idea, pendiente: true });
    await operar(id, async () => (await fetch(`/api/ideas/${id}`, { method: 'DELETE' })).ok, idea);
  }

  /** hace la peticion en bg: undo queda pendiente hasta que termina; si falla revierte */
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

  /** archivar es reversible en la misma fila; eliminar guarda una copia nueva.
   * undo SOLO actua cuando la op de fondo de archivar/eliminar ya termino */
  async function deshacer(guardado: Undo) {
    setUndo(null);
    const idea = guardado.idea;
    const opEnCurso = ops.current.get(idea.id);
    if (opEnCurso && !(await opEnCurso)) return; // op fallo: item ya restaurado con su toast
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
      setIdeas((prev) => prev.some((i) => i.id === idea.id) ? prev : insertarOrdenado(prev, idea));
      return;
    }
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ideaToPayload(idea))
      });
      if (!res.ok) throw new Error('fallo restaurar');
      const json = (await res.json()) as RespuestaIdea;
      setIdeas((prev) => insertarOrdenado(prev, json.idea));
    } catch (e: unknown) {
      void e;
      setToast(ERROR_ACCION);
    }
  }

  return (
    <AppShell
      activeTab="bandeja"
      captureBar={
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
      }
    >
      <InboxList
        ideas={ideas}
        isLoading={cargando}
        error={error}
        onRetry={() => void cargar()}
        onArchive={(id) => void archivar(id)}
        onDelete={(id) => void eliminar(id)}
      />
    </AppShell>
  );
}

/** reinserta al undo respetando orden por creacion (mas reciente arriba) */
function insertarOrdenado(lista: Idea[], idea: Idea): Idea[] {
  return [...lista, idea].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/** lee el body de error de la API si existe (patron { error: string }) */
async function detalleError(res: Response): Promise<string | undefined> {
  try {
    const json = (await res.json()) as { error?: unknown };
    return typeof json.error === 'string' && json.error ? json.error : undefined;
  } catch {
    return undefined;
  }
}
