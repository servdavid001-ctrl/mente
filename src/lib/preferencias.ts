'use client';

import { useCallback, useEffect, useState } from 'react';

export type Tema = 'claro' | 'oscuro' | 'sistema';

export const CLAVE_TEMA = 'mente-tema';
export const TEMA_POR_DEFECTO: Tema = 'sistema';

export function esTema(valor: string | null): valor is Tema {
  return valor === 'claro' || valor === 'oscuro' || valor === 'sistema';
}

export function temaGuardado(): Tema {
  if (typeof window === 'undefined') return TEMA_POR_DEFECTO;
  try {
    const valor = window.localStorage.getItem(CLAVE_TEMA);
    return esTema(valor) ? valor : TEMA_POR_DEFECTO;
  } catch {
    return TEMA_POR_DEFECTO;
  }
}

export function prefiereOscuro(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resuelveOscuro(tema: Tema): boolean {
  if (tema === 'oscuro') return true;
  if (tema === 'claro') return false;
  return prefiereOscuro();
}

export function aplicaTema(tema: Tema): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', resuelveOscuro(tema) ? 'dark' : 'light');
}

export function guardaTema(tema: Tema): void {
  try {
    window.localStorage.setItem(CLAVE_TEMA, tema);
  } catch {
    /* almacenamiento no disponible (modo privado) */
  }
  aplicaTema(tema);
}

/** tema activo; lee localStorage tras montar y escucha al sistema si es 'sistema' */
export function useTema() {
  const [tema, setTema] = useState<Tema>(TEMA_POR_DEFECTO);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setTema(temaGuardado());
    setMontado(true);
  }, []);

  useEffect(() => {
    if (!montado || tema !== 'sistema') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const alCambiar = () => aplicaTema('sistema');
    mq.addEventListener('change', alCambiar);
    return () => mq.removeEventListener('change', alCambiar);
  }, [tema, montado]);

  const cambiar = useCallback((nuevo: Tema) => {
    setTema(nuevo);
    guardaTema(nuevo);
  }, []);

  return { tema, montado, cambiar };
}
