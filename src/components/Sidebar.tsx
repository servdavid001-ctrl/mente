'use client';

import Link from 'next/link';
import IconoNav from './NavIconos';
import type { TabId } from '@/lib/types';

const NAV: { id: TabId; label: string; ariaLabel: string; href: string }[] = [
  { id: 'foco', label: 'Foco', ariaLabel: 'Ir a Foco', href: '/foco' },
  { id: 'bandeja', label: 'Bandeja', ariaLabel: 'Ir a la Bandeja de entrada', href: '/' },
  { id: 'biblioteca', label: 'Biblioteca', ariaLabel: 'Ir a la Biblioteca', href: '/biblioteca' },
  { id: 'ajustes', label: 'Ajustes', ariaLabel: 'Ir a Ajustes', href: '/ajustes' }
];

export default function Sidebar(props: {
  active: TabId;
  email?: string;
  saliendo: boolean;
  onCerrarSesion: () => void;
}) {
  return (
    <aside className="hidden shrink-0 flex-col border-r border-border bg-surface md:flex md:w-60 lg:w-64">
      <div className="px-5 pb-5 pt-6">
        <p className="font-display text-2xl font-semibold lowercase tracking-tight text-text">
          mente<span className="text-accent">.</span>
        </p>
      </div>

      <nav aria-label="Principal" className="flex flex-col gap-1 px-3">
        {NAV.map((tab) => {
          const activa = tab.id === props.active;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-label={tab.ariaLabel}
              aria-current={activa ? 'page' : undefined}
              className={`relative flex h-11 items-center gap-3 rounded-xl px-3 text-[14px] font-semibold transition-colors ${
                activa
                  ? 'bg-accent-soft text-text'
                  : 'text-text-soft nav-hover hover:text-text'
              }`}
            >
              {activa ? (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent"
                />
              ) : null}
              <IconoNav tab={tab.id} className="h-5 w-5 shrink-0" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-border px-5 py-4">
        <p className="mb-3 text-[12px] leading-snug text-text-soft [overflow-wrap:anywhere]">
          {props.email ?? 'Sesion iniciada'}
        </p>
        <button
          type="button"
          onClick={props.onCerrarSesion}
          disabled={props.saliendo}
          className="h-11 w-full rounded-xl border border-border px-3 text-[13px] font-semibold text-text nav-hover hover:text-danger disabled:opacity-50"
        >
          Cerrar sesion
        </button>
      </div>
    </aside>
  );
}
