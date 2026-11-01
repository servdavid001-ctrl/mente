'use client';

import type { ReactElement } from 'react';
import type { TabId } from '@/lib/types';

const TABS: { id: TabId; label: string; ariaLabel: string }[] = [
  { id: 'foco', label: 'Foco', ariaLabel: 'Ir a Foco' },
  { id: 'bandeja', label: 'Bandeja', ariaLabel: 'Ir a la Bandeja de entrada' },
  { id: 'biblioteca', label: 'Biblioteca', ariaLabel: 'Ir a la Biblioteca' }
];

function iconoDe(tab: TabId, activa: boolean): ReactElement {
  const trazo = activa ? 'stroke-[1.75]' : 'stroke-[1.5]';
  if (tab === 'foco') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`h-6 w-6 ${trazo}`} stroke="currentColor">
        <circle cx="12" cy="12" r="8.25" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="0.5" fill="currentColor" />
      </svg>
    );
  }
  if (tab === 'bandeja') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`h-6 w-6 ${trazo}`} stroke="currentColor">
        <path d="M3.75 6.75h16.5v10a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-10Z" />
        <path d="M3.75 12.5h5.2a3.05 3.05 0 0 0 6.1 0h5.2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`h-6 w-6 ${trazo}`} stroke="currentColor">
      <path d="M4 8.5 12 4.25 20 8.5 12 12.75 4 8.5Z" />
      <path d="M4 13.25 12 17.5l8-4.25" />
    </svg>
  );
}

export default function BottomNav(props: {
  active: TabId;
  onChange: (tab: TabId) => void;
}) {
  return (
    <nav
      aria-label="Secciones"
      className="flex shrink-0 items-stretch justify-around border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      {TABS.map((tab) => {
        const activa = tab.id === props.active;
        return (
          <button
            key={tab.id}
            type="button"
            aria-label={tab.ariaLabel}
            aria-current={activa ? 'page' : undefined}
            onClick={() => props.onChange(tab.id)}
            className={`flex h-16 flex-1 flex-col items-center justify-center gap-0.5 text-[12px] font-medium focus-visible:ring-2 focus-visible:ring-accent ${
              activa ? 'text-text' : 'text-text-soft'
            }`}
          >
            {iconoDe(tab.id, activa)}
            <span aria-hidden="true">{tab.label}</span>
            <span
              aria-hidden="true"
              className={`h-0.5 w-5 rounded-full ${activa ? 'bg-accent' : 'bg-transparent'}`}
            />
          </button>
        );
      })}
    </nav>
  );
}
