'use client';

import { useState } from 'react';
import SheetDialog from '@/components/ui/SheetDialog';
import CuerpoFundamento from './CuerpoFundamento';
import PieFundamento from './PieFundamento';
import { useFundamento } from './useFundamento';
import { cuerpoFundamento, tituloFundamento } from '@/lib/fundamentoCuerpo';

/** sheet del fundamento (modulo 16 B): muestra el draft por secciones y
 * Crear guarda la pagina via POST /api/ideas (destino proyecto, modulo 14);
 * Descartar no toca nada (nada se autoguarda). Si ya existe el fundamento la
 * sheet lo muestra (el server no gasta la llamada ni el analisis). */
export default function FundamentoSheet(props: {
  proyectoId: string;
  proyectoNombre: string;
  onCerrar: () => void;
}) {
  const fondo = useFundamento(props.proyectoId);
  const [creando, setCreando] = useState(false);
  const [creada, setCreada] = useState(false);

  async function crear() {
    if (!fondo.propuesta || creada) return;
    setCreando(true);
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'texto',
          text: `${tituloFundamento(props.proyectoNombre)}\n\n${cuerpoFundamento(fondo.propuesta)}`,
          estado: 'proyecto',
          destino: { proyecto_id: props.proyectoId }
        })
      });
      if (!res.ok) {
        const datos = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(datos?.error ?? 'Error');
      }
      setCreada(true);
    } catch (e: unknown) {
      fondo.setError(e instanceof Error ? e.message : 'Error');
      fondo.setFase('error');
    } finally {
      setCreando(false);
    }
  }

  return (
    <SheetDialog
      label={`Fundamento de ${props.proyectoNombre}`}
      onCerrar={props.onCerrar}
      ocupado={creando || fondo.fase === 'cargando'}
    >
      <CuerpoFundamento
        fase={fondo.fase}
        propuesta={fondo.propuesta}
        existente={fondo.existente}
        error={fondo.error}
      />
      <PieFundamento
        fase={fondo.fase}
        creada={creada}
        creando={creando}
        onCrear={() => void crear()}
        onCerrar={props.onCerrar}
      />
    </SheetDialog>
  );
}
