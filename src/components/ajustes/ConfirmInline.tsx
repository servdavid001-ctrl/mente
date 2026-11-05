'use client';

import { useEffect, useRef, useState } from 'react';

/** confirmacion a dos toques con caducidad de 4s (sin modal sorpresa) */
export default function ConfirmInline(props: {
  etiqueta: string;
  confirmacion: string;
  onConfirmar: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const [armado, setArmado] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  function alPulsar() {
    if (!armado) {
      setArmado(true);
      timer.current = window.setTimeout(() => setArmado(false), 4000);
      return;
    }
    if (timer.current !== null) window.clearTimeout(timer.current);
    setArmado(false);
    props.onConfirmar();
  }

  return (
    <button
      type="button"
      onClick={alPulsar}
      disabled={props.disabled}
      aria-live="polite"
      className={props.className ?? 'h-11 rounded-xl border border-[var(--border-control)] px-4 text-[13px] font-semibold text-text disabled:opacity-50'}
    >
      {armado ? props.confirmacion : props.etiqueta}
    </button>
  );
}
