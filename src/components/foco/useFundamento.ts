'use client';

import { useEffect, useState } from 'react';
import type { PropuestaFundamento } from '@/lib/fundamento';

/* hook de la sheet fundamento (modulo 16 B): al abrir pide el draft (una
 * llamada con la clave del usuario que gasta 1 analisis); si ya existe la
 * pagina el server responde su contenido sin gastar nada. Sin guardado: el
 * guardar vive en la sheet via POST /api/ideas. */

type Fase = 'cargando' | 'propuesta' | 'existe' | 'error';

export function useFundamento(proyectoId: string) {
  const [fase, setFase] = useState<Fase>('cargando');
  const [propuesta, setPropuesta] = useState<PropuestaFundamento | null>(null);
  const [existente, setExistente] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    fetch(`/api/proyectos/${proyectoId}/fundamento`, { method: 'POST' })
      .then(async (res) => {
        const datos = (await res.json()) as {
          propuesta?: unknown;
          existe?: unknown;
          contenido?: unknown;
          error?: unknown;
        };
        if (res.ok && datos.existe === true) {
          if (vivo) {
            setExistente(typeof datos.contenido === 'string' ? datos.contenido : null);
            setFase('existe');
          }
          return;
        }
        if (res.ok && datos.propuesta) {
          if (vivo) {
            setPropuesta(datos.propuesta as PropuestaFundamento);
            setFase('propuesta');
          }
          return;
        }
        throw new Error(typeof datos.error === 'string' ? datos.error : 'Error');
      })
      .catch((e: unknown) => {
        if (vivo) {
          setError(e instanceof Error ? e.message : 'Error');
          setFase('error');
        }
      });
    return () => {
      vivo = false;
    };
  }, [proyectoId]);

  return { fase, setFase, propuesta, existente, error, setError };
}
