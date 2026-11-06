'use client';

/* modulo 9: panel de Higiene asistida (FOUNDATION punto 11). El sistema solo
 * sugiere: lista de recomendaciones con acciones explicitas por item, nada
 * automatico. Reutiliza el AppShell de las otras tabs con 'bandeja' activo. */

import { useCallback, useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import EstadoHigiene from './EstadoHigiene';
import GruposHigiene from './GruposHigiene';
import { useHigieneAcciones } from './useHigieneAcciones';
import { type Recomendacion, type RespHigiene } from '@/lib/higiene';

const ERROR_CARGA = 'No se pudieron revisar tus datos. Reintenta.';

export default function HigienePanel(props: { email?: string }) {
  const [recs, setRecs] = useState<Recomendacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch('/api/higiene', { cache: 'no-store' });
      if (!res.ok) throw new Error('fallo carga');
      setRecs(((await res.json()) as RespHigiene).recomendaciones ?? []);
    } catch {
      setRecs([]);
      setError(ERROR_CARGA);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const acciones = useHigieneAcciones({
    quitar: (rec: Recomendacion) => {
      setRecs((prev) => prev.filter((r) => !(r.id === rec.id && r.tipo === rec.tipo)));
      return () =>
        setRecs((prev) =>
          prev.some((r) => r.id === rec.id && r.tipo === rec.tipo) ? prev : [...prev, rec]
        );
    },
    aviso: (mensaje: string) => setToast(mensaje)
  });

  return (
    <AppShell activeTab="bandeja" titulo="Higiene" email={props.email}>
      <div className="mx-auto w-full max-w-[46rem] space-y-2">
        {toast ? (
          <p role="alert" className="rounded-card bg-danger px-4 py-2.5 text-sm text-white">
            {toast}
          </p>
        ) : null}
        {cargando || error || recs.length === 0 ? (
          <EstadoHigiene cargando={cargando} error={error} onReintentar={() => void cargar()} />
        ) : (
          <GruposHigiene recs={recs} acciones={acciones} />
        )}
      </div>
    </AppShell>
  );
}
