'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../AppShell';
import CategorizarSheet from './CategorizarSheet';
import ConexionesPanel from './ConexionesPanel';
import ItemConnectPicker from './ItemConnectPicker';
import MetadatosItem from './MetadatosItem';
import AccionesDetalle from './AccionesDetalle';
import { HeroItem, VisualNota } from './HeroItem';
import NotaEditor from './NotaEditor';
import ExpansionItem from './ExpansionItem';
import ExternaPanel from '@/components/ai/ExternaPanel';
import BotonCrearTareas from './BotonCrearTareas';
import ExplicarFAB from '@/components/ai/ExplicarFAB';
import ExplicarPanel, { type Turno } from '@/components/ai/ExplicarPanel';
import UndoPrompt, { type Undo } from '@/components/UndoPrompt';
import { guardarCategorizacion, quitarDeBiblioteca, enviarAProyecto as enviarAProyectoApi } from '../bandeja/useCategorizar';
import { cargarDetalle, idsConectados, type Datos } from './detalle/cargarDetalle';
import { ideaToPayload } from '@/lib/ideas';
import type { Coleccion, Conexion, Idea } from '@/lib/types';

const ERROR_CARGA = 'No pudimos cargar tu biblioteca. Reintentar';
const ERROR_ACCION = 'No se pudo completar la accion. Reintenta.';
const ERROR_MEDIA = 'No se pudo subir la imagen. Reintenta.';

/** pagina Detalle /biblioteca/[id] (spec §4): hero, nota, metadatos,
 * ConexionesPanel + picker, acciones con UNDO 6s y ajuste de colecciones */
export default function DetalleItem(props: { ideaId: string; email?: string }) {
  const router = useRouter();
  const ops = useRef<Map<string, Promise<boolean>>>(new Map());
  // la pagina vive sobre un solo item: lo guardo como lista de 1 para reutilizar
  // el hook useCategorizar (contrato intacto, setIdeas funciona igualmente)
  const [lista, setLista] = useState<Idea[]>([]);
  const [otros, setOtros] = useState<Datos[]>([]);
  const [colecciones, setColecciones] = useState<Coleccion[]>([]);
  const [conexiones, setConexiones] = useState<Conexion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [toast, setToast] = useState<string | null>(null);
  const [sheetAbierto, setSheetAbierto] = useState(false);
  const [sheetOcupado, setSheetOcupado] = useState(false);
  const [pickerAbierto, setPickerAbierto] = useState(false);
  const [editandoNota, setEditandoNota] = useState(false);
  const [nota, setNota] = useState('');
  const [undo, setUndo] = useState<Undo | null>(null);
  const [eliminada, setEliminada] = useState(false);
  // AI modulo 3: panel explicar (hilo vivo mientras la pagina vive)
  const [explicarAbierto, setExplicarAbierto] = useState(false);
  const [explicarEstado, setExplicarEstado] = useState<'cerrado' | 'pensando' | 'listo' | 'error' | 'rate'>('cerrado');
  const [hilo, setHilo] = useState<Turno[]>([]);
  const recargando = useRef(false);

  const idea = lista[0] ?? null;
  const h = {
    setIdeas: setLista,
    setColecciones,
    toast: (m: string) => setToast(m)
  };

  const cargar = useCallback(async () => {
    if (recargando.current) return;
    recargando.current = true;
    setCargando(true);
    try {
      const d = await cargarDetalle(props.ideaId);
      if (!d.idea || d.idea.estado !== 'biblioteca') {
        router.replace('/biblioteca');
        return;
      }
      setLista([d.idea]);
      setOtros(d.otros);
      setColecciones(d.colecciones);
      setConexiones(d.conexiones);
      setNota(d.idea.nota ?? '');
      setEditandoNota(!d.idea.nota);
    } catch {
      setError(ERROR_CARGA);
    } finally {
      setCargando(false);
      recargando.current = false;
    }
  }, [props.ideaId, router]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function salvarNota() {
    const item = idea;
    if (!item || (item.nota ?? '') === nota) return; // nada que guardar
    const res = await fetch(`/api/ideas/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nota })
    });
    if (!res.ok) {
      setToast(ERROR_ACCION);
      return;
    }
    const json = (await res.json()) as { idea: Idea };
    setLista((prev) => prev.map((w) => (w.id === item.id ? json.idea : w)));
  }

  /** upload client-first al bucket con la sesion del usuario (RLS gate); aqui
   * solo se fija el puntero. UNA sola ruta: la misma se sube y se registra */
  async function subeMedia(file: File) {
    const item = idea;
    if (!item) return;
    try {
      const { createClient } = await import('@/utils/supabase/browser');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setToast(ERROR_ACCION);
        return;
      }
      const ruta = `${user.id}/${crypto.randomUUID()}${extDe(file.type)}`;
      const { error: errSubida } = await supabase.storage
        .from('biblioteca-media')
        .upload(ruta, file, { contentType: file.type });
      if (errSubida) throw errSubida;
      const res = await fetch(`/api/ideas/${item.id}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruta })
      });
      if (!res.ok) throw new Error('puntero de media');
      const json = (await res.json()) as { idea: Idea };
      setLista((prev) => prev.map((w) => (w.id === item.id ? json.idea : w)));
    } catch {
      setToast(ERROR_MEDIA);
    }
  }

  async function quitarMedia() {
    const item = idea;
    if (!item) return;
    const res = await fetch(`/api/ideas/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ media_url: null })
    });
    if (!res.ok) {
      setToast(ERROR_ACCION);
      return;
    }
    const json = (await res.json()) as { idea: Idea };
    setLista((prev) => prev.map((w) => (w.id === item.id ? json.idea : w)));
  }

  async function conectar(haciaId: string, notaC?: string) {
    const item = idea;
    if (!item) return;
    const res = await fetch('/api/conexiones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ desdeId: item.id, haciaId, nota: notaC })
    });
    if (res.status === 409) {
      setToast('Ya estan conectadas.');
      return;
    }
    if (!res.ok) {
      setToast(ERROR_ACCION);
      return;
    }
    const json = (await res.json()) as { conexion: Conexion };
    setConexiones((prev) => [...prev, json.conexion]);
  }

  /** inserta el texto de la AI en la nota del usuario (spec 14.1) y la guarda */
  async function anexarANota(texto: string) {
    const item = idea;
    if (!item) return;
    const nueva = `${(item.nota ?? '') + (item.nota ? '\n\n' : '')}${texto}`;
    setNota(nueva);
    setEditandoNota(true);
    const res = await fetch(`/api/ideas/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nota: nueva })
    });
    if (!res.ok) {
      setToast(ERROR_ACCION);
      return;
    }
    const json = (await res.json()) as { idea: Idea };
    setLista((prev) => prev.map((w) => (w.id === item.id ? json.idea : w)));
  }

  /* -- Explicar (spec modulo3 15): streaming con hilo persistente local --
     El turno AI se agrega al finalizar la descarga; durante la carga el hilo
     y el input del usuario no se alteran (nada queda "en el aire") */
  function abrirExplicar() {
    setExplicarAbierto(true);
    if (hilo.length === 0) void explicar('');
  }

  async function explicar(pregunta: string) {
    const item = idea;
    if (!item) return;
    const historial = hilo.slice(-5).filter((t) => t.texto !== '');
    setExplicarEstado('pensando');
    try {
      const res = await fetch('/api/ai/explicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId: item.id, pregunta, historial })
      });
      if (res.status === 429) {
        setExplicarEstado('rate');
        return;
      }
      if (!res.ok || !res.body) {
        setExplicarEstado('error');
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let texto = '';
      for (;;) {
        const r = await reader.read();
        if (r.done) break;
        texto += dec.decode(r.value, { stream: true });
      }
      if (texto.trim() === '') {
        setHilo((prev) => sinTurnosIncompletos(prev));
        setExplicarEstado('error');
        return;
      }
      setHilo((prev) => [
        ...sinTurnosIncompletos(prev),
        ...(pregunta ? [{ de: 'yo' as const, texto: pregunta }] : []),
        { de: 'ai', texto }
      ]);
      setExplicarEstado('listo');
    } catch {
      setHilo((prev) => sinTurnosIncompletos(prev));
      setExplicarEstado('error');
    }
  }

  /** reintento retoma la ultima pregunta sin perder el trabajo (spec 17) */
  async function reintentarExplicar() {
    setExplicarEstado('pensando');
    setHilo((prev) => sinTurnosIncompletos(prev));
    const ultima = [...hilo].reverse().find((t) => t.de === 'yo' && t.texto !== '');
    const previa = ultima ? hilo.slice(0, hilo.indexOf(ultima)) : [];
    setHilo(previa);
    await explicar(ultima?.texto ?? '');
  }

  function sinTurnosIncompletos(previo: Turno[]): Turno[] {
    return previo.filter((t) => t.texto !== '');
  }

  async function quitarConexion(id: string) {
    const res = await fetch(`/api/conexiones?id=${id}`, { method: 'DELETE' });
    if (!res.ok) {
      setToast(ERROR_ACCION);
      return;
    }
    setConexiones((prev) => prev.filter((c) => c.id !== id));
  }

  /** archivar reversible (desarchivar sin undo) / archivar con UNDO 6s */
  async function archivar() {
    const item = idea;
    if (!item || ops.current.has(item.id)) return;
    if (item.archivada) {
      setLista((prev) =>
        prev.map((w) => (w.id === item.id ? { ...w, archivada: false } : w))
      );
      const res = await fetch(`/api/ideas/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivada: false })
      });
      if (!res.ok) {
        setLista((prev) =>
          prev.map((w) => (w.id === item.id ? { ...w, archivada: true } : w))
        );
        setToast(ERROR_ACCION);
      }
      return;
    }
    setLista((prev) =>
      prev.map((w) => (w.id === item.id ? { ...w, archivada: true } : w))
    );
    setUndo({ tipo: 'archivar', texto: 'Item archivado', idea: item, pendiente: true });
    await operar(item.id, async () => {
      const res = await fetch(`/api/ideas/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivada: true })
      });
      return res.ok;
    }, item);
  }

  /** elimina (2-tap ya confirmado) y deja la pagina en estado 'eliminada' con
   * UNDO 6s disponible; mismo patron del modulo 1 (spec §4) */
  async function eliminar() {
    const item = idea;
    if (!item || ops.current.has(item.id)) return;
    setUndo({ tipo: 'eliminar', texto: 'Item eliminado', idea: item, pendiente: true });
    await operar(item.id, async () => {
      const res = await fetch(`/api/ideas/${item.id}`, { method: 'DELETE' });
      return res.ok;
    }, item);
    setEliminada(true);
  }

  /** patron del modulo 1: op de fondo pendiente mientras el undo esta vivo */
  async function operar(id: string, peticion: () => Promise<boolean>, previo: Idea) {
    const op = (async () => {
      if (await peticion()) {
        setUndo((a) => (a !== null && a.idea.id === id ? { ...a, pendiente: false } : a));
        return true;
      }
      setUndo((a) => (a !== null && a.idea.id === id ? null : a));
      setLista((prev) =>
        prev.some((w) => w.id === id) ? prev.map((w) => (w.id === id ? previo : w)) : prev
      );
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
    const item = guardado.idea;
    const enCurso = ops.current.get(item.id);
    if (enCurso && !(await enCurso)) return; // la op fallo: item ya restaurado
    if (eliminada) {
      // undo de eliminar: se recreea en la Bandeja (contrato del modulo 1)
      try {
        const res = await fetch('/api/ideas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ideaToPayload(item))
        });
        if (!res.ok) throw new Error('fallo restaurar');
        router.push('/'); // la idea restaurada vive en la Bandeja
      } catch {
        setToast(ERROR_ACCION);
      }
      return;
    }
    // undo de archivar: vuelve a estar disponible
    const res = await fetch(`/api/ideas/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archivada: false })
    });
    if (!res.ok) {
      setToast(ERROR_ACCION);
      return;
    }
    setLista((prev) =>
      prev.map((w) => (w.id === item.id ? { ...w, archivada: false } : w))
    );
  }

  const conectadasYa = idea ? idsConectados(conexiones, idea.id) : [];

  return (
    <AppShell
      activeTab="biblioteca"
      titulo="Detalle"
      email={props.email}
      headerLeft={
        <button
          type="button"
          aria-label="Volver a la biblioteca"
          onClick={() => router.push('/biblioteca')}
          className="flex h-11 w-11 items-center justify-center text-text"
        >
          <span aria-hidden="true">←</span>
        </button>
      }
    >
      <div className="mx-auto w-full max-w-[64rem]">
      {toast ? (
        <p role="alert" className="mb-3 rounded-card bg-danger px-4 py-2.5 text-sm text-white">
          {toast}
        </p>
      ) : null}

      {cargando ? (
        <div className="space-y-3" aria-hidden="true">
          <div className="anim-shimmer h-40 w-full rounded-card bg-gradient-to-r from-border via-surface to-border" />
          <div className="anim-shimmer h-4 w-2/3 rounded-blob bg-border" />
          <div className="anim-shimmer h-16 w-full rounded-card bg-border" />
        </div>
      ) : null}

      {!cargando && error ? (
        <div className="rounded-card bg-danger px-4 py-3 text-sm text-white">
          {error}
          <button
            type="button"
            onClick={() => void cargar()}
            className="ml-2 h-9 rounded-blob border border-white px-3 text-[13px] font-semibold"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {eliminada ? (
        <div className="space-y-3 pt-10 text-center">
          <p className="text-[14px] font-semibold text-text">Item eliminado</p>
          <p className="text-[13px] text-text-soft">
            Si deshaces, la idea regresa a la Bandeja; si no, queda para siempre fuera.
          </p>
          {undo ? (
            <UndoPrompt
              activo={undo}
              onDeshacer={() => void deshacer(undo)}
              onCerrar={() => setUndo(null)}
            />
          ) : null}
          <button
            type="button"
            aria-label="Volver a la biblioteca"
            onClick={() => router.push('/biblioteca')}
            className="h-11 w-full rounded-card border border-border text-[14px] font-semibold text-text"
          >
            Volver a la biblioteca
          </button>
        </div>
      ) : null}

      {!cargando && !error && !eliminada && idea ? (
        <div className="space-y-4">
          <HeroItem idea={idea} />

          <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8">
            <div className="min-w-0 space-y-4">
              <section aria-label="Nota de la idea">
                {editandoNota ? (
                  <>
                    <NotaEditor
                      value={nota}
                      onChange={setNota}
                      onSave={salvarNota}
                    />
                    <button
                      type="button"
                      aria-label="Mostrar la nota guardada"
                      onClick={() => {
                        void salvarNota();
                        setEditandoNota(false);
                      }}
                      className="h-9 text-[12px] text-text-soft"
                    >
                      Ver nota
                    </button>
                  </>
                ) : (
                  <>
                    <VisualNota nota={idea.nota} />
                    <button
                      type="button"
                      aria-label="Editar la nota"
                      onClick={() => setEditandoNota(true)}
                      className="h-9 text-[12px] text-text-soft"
                    >
                      Editar nota
                    </button>
                  </>
                )}
              </section>

              <ConexionesPanel
                conexiones={conexiones}
                items={itemsIndex(otros)}
                itemIdActual={idea.id}
                onRemove={(id) => void quitarConexion(id)}
              />

              <ExpansionItem
                idea={idea}
                conectadasYa={conectadasYa}
                onNuevaConexion={(conexion) =>
                  setConexiones((prev) =>
                    prev.some((c) => c.id === conexion.id) ? prev : [...prev, conexion]
                  )
                }
                onNotaAppend={(texto) => void anexarANota(texto)}
              />

              <ExternaPanel
                idea={idea}
                onIdea={(guardada) =>
                  setLista((prev) =>
                    prev.some((w) => w.id === guardada.id)
                      ? prev.map((w) => (w.id === guardada.id ? guardada : w))
                      : prev
                  )
                }
              />
            </div>

            <aside className="min-w-0 space-y-4 lg:sticky lg:top-6">
              <MetadatosItem
                idea={idea}
                colecciones={colecciones}
                onAjustar={() => setSheetAbierto(true)}
                onQuitarMedia={() => void quitarMedia()}
                onSubirMedia={(f) => void subeMedia(f)}
              />

              <BotonCrearTareas idea={idea} />

              {!pickerAbierto ? (
                <button
                  type="button"
                  aria-label="Conectar con otra idea"
                  onClick={() => setPickerAbierto(true)}
                  className="h-11 w-full rounded-card border border-border text-[14px] font-semibold text-text"
                >
                  Conectar con...
                </button>
              ) : (
                <ItemConnectPicker
                  items={otros}
                  itemIdActual={idea.id}
                  conectadasYa={conectadasYa}
                  colecciones={colecciones}
                  onConnect={conectar}
                  onCancel={() => setPickerAbierto(false)}
                />
              )}

              <button
                type="button"
                onClick={() => abrirExplicar()}
                className="hidden h-11 w-full items-center justify-center gap-2 rounded-card border border-border text-[14px] font-semibold text-text lg:flex"
              >
                <span aria-hidden="true">✦</span>
                Explicar con AI
              </button>

              <AccionesDetalle
                archivada={Boolean(idea.archivada)}
                onArchivar={() => void archivar()}
                onEliminar={() => void eliminar()}
              />
            </aside>
          </div>
        </div>
      ) : null}

      {/* FAB Explicar + panel chat (esquina inferior derecha, no tapa el hero) */}
      {!cargando && !error && !eliminada && idea && !explicarAbierto ? (
        <ExplicarFAB
          onClick={() => abrirExplicar()}
          ariaLabel="Explicar este item con la AI"
        />
      ) : null}
      {!cargando && !error && !eliminada && idea && explicarAbierto ? (
        <ExplicarPanel
          item={{ titulo: tituloDe(idea) }}
          hilo={hilo}
          estado={explicarEstado}
          onPreguntar={(texto) => void explicar(texto)}
          onReintentar={() => void reintentarExplicar()}
          onCerrar={() => {
            setExplicarAbierto(false); // el hilo NO se pierde al cerrar (spec 15)
            setExplicarEstado('cerrado');
          }}
        />
      ) : null}

      {!cargando && !error && !eliminada && idea && sheetAbierto ? (
        <CategorizarSheet
          ideaPreview={preview(idea)}
          colecciones={colecciones}
          iniciales={idea.colecciones ?? []}
          yaCategorizada
          ocupado={sheetOcupado}
          onSave={async (payload) => {
            setSheetOcupado(true);
            const ok = await guardarCategorizacion(idea.id, payload, h);
            setSheetOcupado(false);
            if (ok) setSheetAbierto(false);
          }}
          onQuitar={async () => {
            setSheetOcupado(true);
            const ok = await quitarDeBiblioteca(idea.id, h);
            setSheetOcupado(false);
            if (ok) router.push('/biblioteca');
          }}
          enviarAProyecto={async (proyectoId, estado) => {
            /* modulo 12: salida explicita de Biblioteca a un proyecto (Notas
               o Investigacion) con el PUT existente; la idea deja esta pagina */
            setSheetOcupado(true);
            const ok = await enviarAProyectoApi(idea.id, proyectoId, estado);
            setSheetOcupado(false);
            if (ok) router.push('/biblioteca');
            return ok;
          }}
          onCerrar={() => setSheetAbierto(false)}
        />
      ) : null}
      </div>
    </AppShell>
  );
}

/** index de otros items para el panel de conexiones (titulo + tipo) */
function itemsIndex(otros: Datos[]): Record<string, { titulo: string; tipo: string }> {
  const index: Record<string, { titulo: string; tipo: string }> = {};
  for (const i of otros) index[i.id] = { titulo: tituloDe(i), tipo: i.kind };
  return index;
}

function tituloDe(idea: Pick<Idea, 'text' | 'kind' | 'sourceUrl'>): string {
  const primera = (idea.text || '').split('\n')[0].trim();
  if (primera) return primera;
  if (idea.kind === 'link') return idea.sourceUrl ?? 'Link';
  if (idea.kind === 'voz') return 'Nota de voz';
  return 'Arte';
}

function preview(idea: Idea): string {
  if (idea.kind === 'link') return idea.sourceUrl ?? '';
  if (idea.mediaUrl) return 'Con imagen';
  return idea.text || 'Nota de voz';
}

function extDe(tipo: string): string {
  const conocidas: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/avif': '.avif'
  };
  return conocidas[tipo] ?? '.jpg';
}
