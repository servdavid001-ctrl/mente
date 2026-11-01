'use client';

import { useCallback, useEffect, useState } from 'react';
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
      if (!res.ok) throw new Error('fallo guardado');
      const json = (await res.json()) as RespuestaIdea;
      setIdeas((prev) => prev.map((i) => (i.id === temp.id ? json.idea : i)));
      navigator.vibrate?.(10);
    } catch (e: unknown) {
      void e;
      setIdeas((prev) => prev.filter((i) => i.id !== temp.id));
      setToast(ERROR_ENVIO);
      throw e; // CaptureBar conserva el texto si onSend rechaza
    }
  }

  async function archivar(id: string) {
    const idea = ideas.find((i) => i.id === id);
    const res = await fetch(`/api/ideas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archivada: true })
    });
    if (!res.ok) {
      setToast(ERROR_ACCION);
      return;
    }
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    if (idea) setUndo({ tipo: 'archivar', texto: 'Idea archivada', idea });
  }

  async function eliminar(id: string) {
    const idea = ideas.find((i) => i.id === id);
    const res = await fetch(`/api/ideas/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      setToast(ERROR_ACCION);
      return;
    }
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    if (idea) setUndo({ tipo: 'eliminar', texto: 'Idea eliminada', idea });
  }

  /** archivar es reversible en la misma fila; eliminar guarda una copia nueva */
  async function deshacer(guardado: Undo) {
    setUndo(null);
    const idea = guardado.idea;
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
