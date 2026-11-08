'use client';

import { useState } from 'react';

export const SIN_SOL = 'Solicitud no encontrada o expirada.';

type Props = {
  device?: string;
  nombre?: string;
  expiraEn?: string;
  mensaje?: string;
};

/** modulo 18: panel de autorizacion del CLI login. Muestra quien pide
 * acceso y su vencimiento; Autorizar/Rechazar llaman /api/conectar/aprobar
 * y SOLO reciben {estado} (el token nunca llega aqui). */
export default function ConectarPanel(props: Props) {
  const [estado, setEstado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function decidir(aprobar: boolean) {
    if (ocupado || !props.device) return;
    setOcupado(true);
    setError(null);
    try {
      const res = await fetch('/api/conectar/aprobar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_code: props.device, aprobar })
      });
      const data = (await res.json().catch(() => null)) as { estado?: string; error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? 'No se pudo procesar la solicitud.');
      setEstado(data?.estado ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setOcupado(false);
    }
  }

  const horaExpira = props.expiraEn
    ? new Date(props.expiraEn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  if (props.mensaje && !props.device) {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-bg px-6">
        <div className="m-2 p-8 text-center w-full max-w-[26rem] rounded-card border border-border bg-surface shadow-card">
          <h1 className="font-display text-xl font-semibold leading-tight">Conectar CLI</h1>
          <p className="mt-1 text-[14px] text-text-soft">{props.mensaje}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-bg px-6">
      <div className="w-full max-w-[26rem] rounded-card border border-border bg-surface p-8 shadow-card">
        <h1 className="font-display text-[22px] font-semibold leading-tight">Conectar CLI</h1>
        {estado === 'aprobado' || estado === 'rechazado' ? (
          <p role="status" className="mt-2 text-[15px] text-text-soft">
            {estado === 'aprobado'
              ? 'Acceso autorizado. Vuelve a tu CLI para el token.'
              : 'Acceso rechazado. La CLI no tendra token.'}
          </p>
        ) : estado ? (
          <p role="status" className="mt-2 text-[15px] text-text-soft">
            No se pudo procesar; reintenta desde la CLI.
          </p>
        ) : (
          <>
            <p className="mt-2 text-[15px] text-text-soft">
              La CLI <strong>{props.nombre}</strong> pide acceso a tu cuenta Mente.
            </p>
            {horaExpira ? (
              <p className="mt-1 text-[13px] text-text-soft">Expira a las {horaExpira}.</p>
            ) : null}
            {error ? <p role="alert" className="mt-2 text-[13px] text-danger">{error}</p> : null}
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                disabled={ocupado}
                aria-label="Autorizar el acceso de la CLI"
                onClick={() => void decidir(true)}
                className="h-12 flex-1 rounded-card bg-accent text-[15px] font-semibold text-white disabled:opacity-60"
              >
                {ocupado ? 'Enviando...' : 'Autorizar'}
              </button>
              <button
                type="button"
                disabled={ocupado}
                aria-label="Rechazar el acceso de la CLI"
                onClick={() => void decidir(false)}
                className="h-12 flex-1 rounded-card border border-border text-[15px] font-semibold text-text disabled:opacity-60"
              >
                Rechazar
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
