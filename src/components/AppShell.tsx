'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/browser';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import type { TabId } from '@/lib/types';

type Props = {
  children: ReactNode;
  activeTab: TabId;
  /** titulo del header (sobrescribe el logo "Mente"); misma seccion del modulo 1 */
  titulo?: string;
  /** slot izquierdo del header (back arrow del detalle); invisible si no viene */
  headerLeft?: ReactNode;
  /** acciones del header de escritorio (conteos, toggles) */
  headerActions?: ReactNode;
  /** solo la tab Bandeja renderiza CaptureBar (y avisos) — lo pasa el caller */
  captureBar?: ReactNode;
  /** email del usuario para el footer del sidebar (lo pasa la pagina server) */
  email?: string;
};

export default function AppShell(props: Props) {
  const tab = props.activeTab;
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);

  async function cerrarSesion() {
    if (saliendo) return;
    setSaliendo(true);
    try {
      await createClient().auth.signOut();
    } catch {
      /* si falla la red, igual volvemos al login */
    }
    router.replace('/login');
  }

  const conCaptura = Boolean(props.captureBar) && tab === 'bandeja';

  return (
    <div className="flex h-[100dvh] w-full">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-text focus:shadow-pop"
      >
        Saltar al contenido
      </a>

      <Sidebar active={tab} email={props.email} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col md:max-w-none">
          <header className="flex h-12 shrink-0 items-center gap-1 border-b border-border px-4 md:hidden">
            {props.headerLeft ?? null}
            <span className="min-w-0 truncate font-display text-lg font-semibold tracking-tight">
              {props.titulo ?? 'Mente'}
            </span>
            {tab !== 'ajustes' ? (
              <Link
                href="/ajustes"
                aria-label="Ajustes"
                className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-soft hover:text-text"
              >
                <svg
                  viewBox="0 0 24 24" fill="none" aria-hidden="true"
                  className="h-5 w-5" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                </svg>
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => void cerrarSesion()}
              disabled={saliendo}
              aria-label="Cerrar sesion"
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-soft hover:text-text disabled:opacity-50 ${
                tab === 'ajustes' ? 'ml-auto' : ''
              }`}
            >
              <svg
                viewBox="0 0 24 24" fill="none" aria-hidden="true"
                className="h-5 w-5" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15" />
                <path d="M10 8l-4 4 4 4" />
                <path d="M6 12h9" />
              </svg>
            </button>
          </header>

          <header className="hidden h-14 shrink-0 items-center gap-2 border-b border-border px-6 md:flex lg:px-8">
            {props.headerLeft ?? null}
            <span className="min-w-0 truncate font-display text-[22px] font-semibold tracking-tight lg:text-2xl">
              {props.titulo ?? 'Mente'}
            </span>
            {props.headerActions ? (
              <div className="ml-auto flex shrink-0 items-center gap-3">{props.headerActions}</div>
            ) : null}
          </header>

          <main
            id="contenido"
            data-captura={conCaptura ? 'true' : undefined}
            className="app-main min-h-0 flex-1 overflow-y-auto px-4 pt-5 md:px-6 md:pt-6 lg:px-8"
          >
            {props.children}
          </main>

          {conCaptura ? (
            <div className="shrink-0 border-t border-border bg-surface px-3 py-2 md:border-border md:bg-bg md:px-6 md:py-3 lg:px-8">
              <div className="md:mx-auto md:max-w-[46rem]">{props.captureBar}</div>
            </div>
          ) : null}
        </div>

        <BottomNav active={tab} />
      </div>
    </div>
  );
}
