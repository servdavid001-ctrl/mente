'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  crearTokenAgente,
  guardarPermisosToken,
  listarTokensAgente,
  revocarTokenAgente,
  type TokenAgente
} from '@/lib/agentes';

const ERROR_CARGA = 'No pudimos cargar los tokens de agentes.';
const ERROR_ACCION = 'No se pudo completar la accion. Reintenta.';
const ERROR_PERMISOS = 'No se pudieron guardar los permisos.';

/** estado + acciones de la seccion Acceso para agentes (solo /ajustes).
 * Modulo 19: guardarPermisos hace PUT por toggle con update optimista,
 * rollback si falla y toast. */
export function useTokensAgente() {
  const [tokens, setTokens] = useState<TokenAgente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [nuevo, setNuevo] = useState<string | null>(null);
  const [nuevoId, setNuevoId] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function guardarPermisos(id: string, permisos: string[]): Promise<void> {
    const snapshot = tokens;
    setTokens((old) =>
      old.map((token) => (token.id === id ? { ...token, permisos } : token))
    );
    try {
      const fijados = await guardarPermisosToken(id, permisos);
      setTokens((old) =>
        old.map((token) => (token.id === id ? { ...token, permisos: fijados } : token))
      );
    } catch {
      setTokens(snapshot);
      setToast(ERROR_PERMISOS);
    }
  }

  const cargar = useCallback(async () => {
    try {
      setTokens(await listarTokensAgente());
      setError(undefined);
    } catch {
      setError(ERROR_CARGA);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function generar(nombre: string): Promise<{ id: string; token: string }> {
    if (ocupado) throw new Error(ERROR_ACCION);
    setOcupado(true);
    setError(undefined);
    setNuevo(null);
    setNuevoId(null);
    try {
      const creado = await crearTokenAgente(nombre);
      setNuevo(creado.token);
      setNuevoId(creado.id);
      await cargar();
      return creado;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : ERROR_ACCION);
      throw err;
    } finally {
      setOcupado(false);
    }
  }

  async function revocar(id: string): Promise<void> {
    if (ocupado) return;
    setOcupado(true);
    setError(undefined);
    try {
      await revocarTokenAgente(id);
      setTokens((prev) => prev.filter((token) => token.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : ERROR_ACCION);
    } finally {
      setOcupado(false);
    }
  }

  return {
    tokens, cargando, error, nuevo, nuevoId, ocupado, toast,
    generar, revocar, guardarPermisos
  };
}
