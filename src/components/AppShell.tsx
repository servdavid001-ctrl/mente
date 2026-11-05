'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/browser';
import BottomNav from './BottomNav';
import type { TabId } from '@/lib/types';

type Props = {
  children: ReactNode;
  activeTab: TabId;
  /** titulo del header (sobrescribe el logo "Mente"); misma seccion del modulo 1 */
  titulo?: string;
  /** slot izquierdo del header (back arrow del detalle); invisible si no viene */
  headerLeft?: ReactNode;
  /** solo la tab Bandeja renderiza CaptureBar (y avisos) — lo pasa el caller */
  captureBar?: ReactNode;
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

  return (
    <div className="mx-auto flex h-[100dvh] max-w-md flex-col">
      <header className="flex h-12 shrink-0 items-center gap-1 border-b border-border px-4">
        {props.headerLeft ?? null}
        <span className="font-display text-lg font-semibold lowercase tracking-tight">
          {props.titulo ?? 'Mente'}
        </span>
        <button
          type="button"
          onClick={() => void cerrarSesion()}
          disabled={saliendo}
          aria-label="Cerrar sesion"
          className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-soft hover:text-text disabled:opacity-50"
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

      <main
        className="flex-1 overflow-y-auto px-4 pt-5"
        style={{
          paddingBottom: props.captureBar
            ? 'calc(1rem + env(safe-area-inset-bottom))'
            : 'calc(1.5rem + env(safe-area-inset-bottom))'
        }}
      >
        {props.children}
      </main>

      {props.captureBar && tab === 'bandeja' ? props.captureBar : null}
      <BottomNav active={tab} />
    </div>
  );
}
