'use client';

import { useMemo, useState } from 'react';
import { parsearBloques, partesInline } from '@/lib/markdownPagina';
import type { Parte } from '@/lib/markdownPagina';

/** render de los bloques del cuerpo (modulo 14, requisito #0): al recargar la
 * pagina el cuerpo guardado se ve AQUI, debajo del titulo. Componentes React
 * puros (sin dangerouslySetInnerHTML). El estado del check es solo local (no
 * persiste en BD); el texto del item jamas se borra al marcar */
export default function RenderBloques(props: { texto: string }) {
  const bloques = useMemo(() => parsearBloques(props.texto), [props.texto]);
  const [marcados, setMarcados] = useState<Record<number, boolean>>({});
  return (
    <div className="space-y-2 text-[14px] text-text">
      {bloques.map((bloque, i) => (
        <BloqueVista
          key={i}
          indice={i}
          bloque={bloque}
          marcado={marcados[i] ?? (bloque.tipo === 'check' && bloque.hecho)}
          onMarcar={() => setMarcados((prev) => ({ ...prev, [i]: !(marcados[i] ?? false) }))}
        />
      ))}
    </div>
  );
}

function BloqueVista(props: {
  indice: number;
  bloque: ReturnType<typeof parsearBloques>[number];
  marcado: boolean;
  onMarcar: () => void;
}) {
  const b = props.bloque;
  if (b.tipo === 'imagen') {
    return (
      <img
        src={b.url}
        alt="Imagen de la pagina"
        loading="lazy"
        className="max-w-full rounded-card border border-border"
      />
    );
  }
  if (b.tipo === 'titulo') {
    return (
      <p
        className={
          b.nivel === 1
            ? 'font-display text-[17px] font-semibold text-text'
            : 'font-display text-[15px] font-semibold text-text'
        }
      >
        <Inlines texto={b.texto} />
      </p>
    );
  }
  if (b.tipo === 'check') {
    return (
      <label className="flex items-start gap-2" data-hecho={props.marcado ? 'si' : 'no'}>
        <input
          type="checkbox"
          checked={props.marcado}
          onChange={props.onMarcar}
          className="mt-[3px] h-4 w-4 shrink-0 accent-accent"
        />
        <span className={props.marcado ? 'text-text-soft line-through' : undefined}>
          <Inlines texto={b.texto} />
        </span>
      </label>
    );
  }
  return (
    <p className="text-[14px] text-text">
      <Inlines texto={b.texto} />
    </p>
  );
}

/** inline sin HTML: negrita y cursiva como strong/em, el resto texto plano */
function Inlines(props: { texto: string }) {
  const partes = partesInline(props.texto);
  return partes.map((p: Parte, i: number) => {
    if (p.forma === 'negrita') {
      return <strong key={i}>{p.texto}</strong>;
    }
    if (p.forma === 'cursiva') {
      return <em key={i}>{p.texto}</em>;
    }
    return <span key={i}>{p.texto}</span>;
  });
}
