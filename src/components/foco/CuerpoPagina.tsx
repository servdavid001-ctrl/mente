'use client';

import { useEffect, useState } from 'react';
import EditorBloques from './EditorBloques';
import RenderBloques from './RenderBloques';
import { cuerpoDe } from '@/lib/cuerpoPagina';

/** bloque del cuerpo de la pagina (modulo 14, requisito #0 "alli debajo"):
 * ver = los bloques guardados renderizados DEBAJO del titulo, siempre
 * visibles; editar = textarea in-place. Tras Guardar OK se vuelve al modo ver
 * con feedback "Guardado"; si falla, el texto queda en el textarea */
export default function CuerpoPagina(props: {
  texto: string;
  onGuardar: (cuerpo: string) => Promise<void>;
}) {
  const [modo, setModo] = useState<'ver' | 'editar'>(() => (cuerpoDe(props.texto) ? 'ver' : 'editar'));
  const [feedback, setFeedback] = useState<'nada' | 'guardando' | 'guardado' | 'error'>('nada');

  useEffect(() => {
    if (feedback !== 'guardado') return;
    const t = window.setTimeout(() => setFeedback('nada'), 4000);
    return () => window.clearTimeout(t);
  }, [feedback]);

  async function guardar(cuerpo: string): Promise<void> {
    setFeedback('guardando');
    try {
      await props.onGuardar(cuerpo);
      setFeedback('guardado');
      setModo('ver');
    } catch {
      setFeedback('error'); // se queda en editar con el texto intacto
    }
  }

  if (modo === 'ver') {
    return (
      <section aria-label="Cuerpo de la pagina" className="space-y-2">
        <RenderBloques texto={cuerpoDe(props.texto)} />
        {feedback === 'guardado' ? (
          <p aria-live="polite" className="text-[12px] font-semibold text-success">
            Guardado
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => setModo('editar')}
          className="text-[13px] font-semibold text-text-soft"
        >
          Editar cuerpo
        </button>
      </section>
    );
  }
  return (
    <EditorBloques
      cuerpoInicial={cuerpoDe(props.texto)}
      guardando={feedback === 'guardando'}
      errorGuardado={feedback === 'error'}
      onGuardar={(cuerpo) => void guardar(cuerpo)}
      onCancelar={() => setModo('ver')}
    />
  );
}
