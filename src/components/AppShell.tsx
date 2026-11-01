'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import BottomNav from './BottomNav';
import EmptyState from './EmptyState';
import type { TabId } from '@/lib/types';

type Props = {
  children: ReactNode;
  activeTab: TabId;
  /** titulo del header (sobrescribe el logo "Mente"); misma seccion del modulo 1 */
  titulo?: string;
  /** solo la tab Bandeja renderiza CaptureBar (y avisos) — lo pasa el caller */
  captureBar?: ReactNode;
};

export default function AppShell(props: Props) {
  const [tab, setTab] = useState<TabId>(props.activeTab);

  return (
    <div className="mx-auto flex h-[100dvh] max-w-md flex-col">
      <header className="h-12 shrink-0 border-b border-border px-4">
        <span className="font-display text-lg font-semibold lowercase tracking-tight">
          {props.titulo ?? 'Mente'}
        </span>
      </header>

      <main
        className="flex-1 overflow-y-auto px-4 pt-5"
        style={{
          paddingBottom: props.captureBar
            ? 'calc(1rem + env(safe-area-inset-bottom))'
            : 'calc(1.5rem + env(safe-area-inset-bottom))'
        }}
      >
        {tab === 'bandeja' ? (
          props.children
        ) : (
          <EmptyState
            icon={tab === 'foco' ? 'target' : 'layers'}
            title={
              tab === 'foco'
                ? 'Tu Foco llega pronto. Aqui viviran tus proyectos.'
                : 'Tu Biblioteca llega pronto. Aqui guardaras arte, ideas y referencias.'
            }
          />
        )}
      </main>

      {props.captureBar && tab === 'bandeja' ? props.captureBar : null}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
