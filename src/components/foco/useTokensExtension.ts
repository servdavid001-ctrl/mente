'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  crearTokenCaptura,
  listarTokensCaptura,
  revocarTokenCaptura,
  type TokenCaptura
} from '@/lib/extension';

const ERROR_CARGA = 'No pudimos cargar los tokens.';
const ERROR_ACCION = 'No se pudo completar la accion. Reintenta.';

/** estado + acciones de la tarjeta Extension de Chrome */
export function useTokensExtension() {
  const [tokens, setTokens] = useState<TokenCaptura[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [nuevo, setNuevo] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setTokens(await listarTokensCaptura());
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

  async function generar(): Promise<void> {
    if (ocupado) return;
    setOcupado(true);
    setError(undefined);
    try {
      const creado = await crearTokenCaptura();
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
      await revocarTokenCaptura(id);
      setTokens((prev) => prev.filter((token) => token.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : ERROR_ACCION);
    } finally {
      setOcupado(false);
    }
  }

  return { tokens, cargando, error, nuevo, ocupado, generar, revocar };
}
