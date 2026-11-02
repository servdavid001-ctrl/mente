'use client';

import { useMemo, useState } from 'react';
import type { Coleccion, Idea } from '@/lib/types';
import { Dot } from './ColeccionChip';

type Datos = Pick<Idea, 'id' | 'text' | 'kind' | 'sourceUrl' | 'colecciones'>;

function tituloDe(idea: Datos): string {
  const primera = (idea.text ?? '').split('\n')[0].trim();
  if (primera) return primera;
  if (idea.kind === 'link') return idea.sourceUrl ?? 'Link';
  if (idea.kind === 'voz') return 'Nota de voz';
  return 'Arte';
}

/**
 * busqueda inline de ideas para conectar (spec §4). El duplicado avisa:
 * row visible con el boton deshabilitado + hint inline.
 */
export default function ItemConnectPicker(props: {
  items: Datos[];
  itemIdActual: string;
  /** ids ya conectados (ambos sentidos) para deshabilitar el Conectar */
  conectadasYa: string[];
  colecciones: Coleccion[];
  onConnect: (haciaId: string, nota?: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [q, setQ] = useState('');
  const [elegido, setElegido] = useState<string | null>(null);
  const [nota, setNota] = useState('');
  const [enviando, setEnviando] = useState(false);

  const resultados = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length === 0) return [];
    return props.items
      .filter((i) => i.id !== props.itemIdActual)
      .filter((i) => `${i.text ?? ''} ${i.sourceUrl ?? ''}`.toLowerCase().includes(t))
      .slice(0, 8);
  }, [q, props.items, props.itemIdActual]);

  const yaEsta = elegido !== null && props.conectadasYa.includes(elegido);

  async function conectar() {
    if (!elegido || yaEsta || enviando) return;
    setEnviando(true);
    try {
      await props.onConnect(elegido, nota.trim() || undefined);
      setElegido(null);
      setNota('');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-card border border-border bg-surface p-3">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar mas ideas para conectar..."
        aria-label="Buscar mas ideas para conectar"
        autoFocus
        className="h-11 w-full rounded-card border border-border bg-raised px-3 text-[14px] text-text placeholder:text-text-soft"
      />
      <div aria-live="polite" className="mt-2 space-y-2">
        {elegido !== null ? (
          <div className="rounded-card bg-accent-soft p-3">
            <p className="truncate text-[13px] font-semibold text-text">
              Conectar con: {tituloDe(props.items.find((i) => i.id === elegido) ?? { id: '', text: '', kind: 'texto', colecciones: [] })}
            </p>
            <input
              type="text"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              maxLength={500}
              placeholder="¿Por que lo conectas?"
              aria-label="Nota de la conexion"
              className="mt-2 h-11 w-full rounded-card border border-border bg-raised px-3 text-[13px] text-text placeholder:text-text-soft"
            />
            <button
              type="button"
              disabled={yaEsta || enviando}
              onClick={() => void conectar()}
              className="mt-2 h-11 w-full rounded-card bg-accent text-[14px] font-semibold text-white disabled:opacity-40"
            >
              {enviando ? 'Conectando...' : 'Conectar'}
            </button>
            {yaEsta ? (
              <p role="status" className="mt-1 text-[12px] text-danger">
                Ya estan conectadas.
              </p>
            ) : null}
          </div>
        ) : null}

        {resultados.map((i) => (
          <Row
            key={i.id}
            idea={i}
            conectada={props.conectadasYa.includes(i.id)}
            colecciones={props.colecciones}
            onElegir={() => setElegido(i.id)}
          />
        ))}

        {q.trim().length > 0 && resultados.length === 0 ? (
          <p className="text-[13px] text-text-soft">Nadie coincide con esto.</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={props.onCancel}
        className="mt-2 h-11 text-[13px] text-text-soft"
      >
        Cerrar
      </button>
    </div>
  );
}

/** mini-card de resultado: icono tipo + 2 primeras lineas + dots coleccion */
function Row(props: {
  idea: Datos;
  conectada: boolean;
  colecciones: Coleccion[];
  onElegir: () => void;
}) {
  const mis = new Map(props.colecciones.map((c) => [c.id, c]));
  const dosLineas = (props.idea.text ?? '').split('\n').slice(0, 2).join(' ')
    || props.idea.sourceUrl
    || tituloDe(props.idea);
  return (
    <button
      type="button"
      aria-label={`Conectar con: ${tituloDe(props.idea)}`}
      onClick={props.onElegir}
      className="flex w-full items-center gap-2 rounded-card bg-raised p-2 text-left shadow-card"
    >
      <FrontalMini kind={props.idea.kind} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-text">
          {tituloDe(props.idea)}
        </span>
        <span aria-hidden="true" className="block line-clamp-2 text-[11px] text-text-soft">
          {dosLineas}
        </span>
      </span>
      <span aria-hidden="true" className="flex shrink-0 gap-0.5">
        {(props.idea.colecciones ?? []).slice(0, 3).map((id) => (
          <Dot key={id} color={mis.get(id)?.color} tamano="h-2 w-2" />
        ))}
      </span>
      {props.conectada ? (
        <span aria-hidden="true" className="text-[11px] text-success">
          ✓
        </span>
      ) : null}
    </button>
  );
}

function FrontalMini(props: { kind: Idea['kind'] }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-blob text-[13px] text-accent"
      style={{ backgroundColor: 'var(--accent-soft)' }}
    >
      {props.kind === 'voz' ? '▶' : props.kind === 'link' ? '🔗' : props.kind === 'arte' ? '🎨' : '☰'}
    </span>
  );
}

export type { Datos };
