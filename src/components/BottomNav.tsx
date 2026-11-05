'use client';

import Link from 'next/link';
import IconoNav from './NavIconos';
import type { TabId } from '@/lib/types';

const TABS: { id: TabId; label: string; ariaLabel: string; href: string }[] = [
  { id: 'foco', label: 'Foco', ariaLabel: 'Ir a Foco', href: '/foco' },
  { id: 'bandeja', label: 'Bandeja', ariaLabel: 'Ir a la Bandeja de entrada', href: '/' },
  { id: 'biblioteca', label: 'Biblioteca', ariaLabel: 'Ir a la Biblioteca', href: '/biblioteca' },
  { id: 'ajustes', label: 'Ajustes', ariaLabel: 'Ir a Ajustes', href: '/ajustes' }
];

export default function BottomNav(props: { active: TabId }) {
  return (
    <nav
      aria-label="Secciones"
      className="flex shrink-0 items-stretch justify-around border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {TABS.map((tab) => {
        const activa = tab.id === props.active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-label={tab.ariaLabel}
            aria-current={activa ? 'page' : undefined}
            className={`flex h-16 min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 text-[12px] font-medium focus-visible:ring-2 focus-visible:ring-accent ${
              activa ? 'text-text' : 'text-text-soft'
            }`}
          >
            <IconoNav tab={tab.id} className={`h-6 w-6 ${activa ? 'stroke-[1.75]' : 'stroke-[1.5]'}`} />
            <span aria-hidden="true">{tab.label}</span>
            <span
              aria-hidden="true"
              className={`h-0.5 w-5 rounded-full ${activa ? 'bg-accent' : 'bg-transparent'}`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
