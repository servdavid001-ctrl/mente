'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  crearTokenAgente,
  listarTokensAgente,
  revocarTokenAgente,
  type TokenAgente
} from '@/lib/agentes';

const ERROR_CARGA = 'No pudimos cargar los tokens de agentes.';
const ERROR_ACCION = 'No se pudo completar la accion. Reintenta.';

/** estado + acciones de la seccion Acceso para agentes (solo /ajustes) */
export function useTokensAgente() {
  const [tokens, setTokens] = useState<TokenAgente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [nuevo, setNuevo] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

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

  async function generar(nombre: string): Promise<void> {
    if (ocupado) return;
    setOcupado(true);
    setError(undefined);
    setNuevo(null);
    try {
      const creado = await crearTokenAgente(nombre);
      setNuevo(creado.token);
      await cargar();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : ERROR_ACCION);
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

  return { tokens, cargando, error, nuevo, ocupado, generar, revocar };
}
