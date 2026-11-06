'use client';

import { useEffect, useState } from 'react';
import SeccionExterna from './SeccionExterna';
import ExternaBoton, { type EstadoExterna } from './ExternaBoton';
import { cargarSugerencias } from './cliente';
import { fusionarExternas, validarItemsExterna } from '@/lib/externas';
import {
  aceptarExternas,
  buscarExternasPlan,
  descartarExternas,
  type ExternaActiva
} from './externaCliente';
import type { ItemExterno, Idea } from '@/lib/types';

const ERROR_ACCION = 'No se pudo completar la accion. Reintenta.';

/** conocimiento externo en la ficha (modulo 10, punto #5): seccion de fichas
 * ya aceptadas + boton de consulta (visible solo si analizar detecto
 * entidades autor|libro) + sheet de aprobacion. Todo pasa por click del
 * usuario; el servidor solo escribe en ideas.entidades.externa al aceptar. */
export default function ExternaPanel(props: { idea: Idea; onIdea: (idea: Idea) => void }) {
  const idea = props.idea;
  const lista = idea.entidades?.lista ?? [];
  const aceptadas = idea.entidades?.externa ?? [];
  const buscables = lista.some((e) => e.tipo === 'autor' || e.tipo === 'libro');
  const [activa, setActiva] = useState<ExternaActiva | null>(null);
  const [estado, setEstado] = useState<EstadoExterna>('quieto');
  const [mensaje, setMensaje] = useState('');
  const [ocupado, setOcupado] = useState(false);

  /* busqueda pendiente de una sesion anterior: el boton la reabre sin gastar
   * otro analisis (el server solo crea una nueva en cada POST) */
  useEffect(() => {
    let vivo = true;
    void (async () => {
      const vivas = await cargarSugerencias([idea.id]);
      if (!vivo) return;
      const externa = vivas.find((s) => s.tipo === 'externa' && s.estado === 'pendiente');
      if (externa) {
        const bruto = externa.payload.items;
        const items = validarItemsExterna(Array.isArray(bruto) ? bruto : []);
        if (items.length > 0) setActiva({ id: externa.id, items });
      }
    })();
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea.id]);

  async function buscar() {
    if (activa && activa.items.length > 0) {
      setEstado('sheet');
      return;
    }
    setEstado('loading');
    const pedido = await buscarExternasPlan(idea.id);
    if (pedido.ok) {
      setActiva(pedido.sugerencia);
      setEstado('sheet');
      return;
    }
    setMensaje(pedido.mensaje);
    setEstado(pedido.estado === 'rate' ? 'error' : pedido.estado);
  }

  async function aceptar(seleccionadas: ItemExterno[]) {
    if (!activa) return;
    setOcupado(true);
    const ok = await aceptarExternas(activa.id, seleccionadas);
    setOcupado(false);
    if (!ok) {
      setMensaje(ERROR_ACCION);
      setEstado('error');
      return;
    }
    /* reflejo local del merge que YA hizo el server (fuente de verdad) */
    props.onIdea({
      ...idea,
      entidades: {
        ...(idea.entidades ?? { lista: [] }),
        externa: fusionarExternas(idea.entidades?.externa ?? [], seleccionadas)
      }
    });
    setActiva(null);
    setEstado('quieto');
  }

  async function descartar() {
    if (!activa) return;
    const ok = await descartarExternas(activa.id);
    if (!ok) {
      setMensaje(ERROR_ACCION);
      setEstado('error');
    }
    setActiva(null);
    setEstado('quieto');
  }

  if (aceptadas.length === 0 && !buscables) return null;

  return (
    <>
      {aceptadas.length > 0 ? <SeccionExterna items={aceptadas} /> : null}
      {buscables ? (
        <ExternaBoton
          estado={estado}
          mensaje={mensaje}
          items={activa?.items ?? []}
          ocupado={ocupado}
          onBuscar={() => void buscar()}
          onAceptar={(sel) => void aceptar(sel)}
          onDescartar={() => void descartar()}
          onCerrar={() => setEstado('quieto')}
        />
      ) : null}
    </>
  );
}
