import type { ReactNode } from 'react';

/** chip de estado de una seccion de Ajustes (nunca comunica solo por color) */
export default function ChipEstado(props: {
  children: ReactNode;
  tono?: 'neutro' | 'acento' | 'ok';
}) {
  const tono = props.tono ?? 'neutro';
  const clases =
    tono === 'ok'
      ? 'border-[var(--success)] text-text'
      : tono === 'acento'
        ? 'border-transparent bg-accent-soft text-text'
        : 'border-border text-text-soft';
  return (
    <span className={`inline-flex h-7 items-center rounded-full border px-2.5 text-[12px] font-semibold ${clases}`}>
      {props.children}
    </span>
  );
}
