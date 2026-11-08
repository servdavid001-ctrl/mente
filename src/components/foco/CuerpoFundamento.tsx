'use client';

import VistaPropuesta from './VistaPropuesta';
import type { PropuestaFundamento } from '@/lib/fundamento';

/** cuerpo de la sheet fundamento (modulo 16 B): estados cargando/existe/
 * error + secciones del draft. Solo lectura: nada se guarda aqui. */
export default function CuerpoFundamento(props: {
  fase: 'cargando' | 'propuesta' | 'existe' | 'error';
  propuesta: PropuestaFundamento | null;
  existente: string | null;
  error: string | null;
}) {
  return (
    <>
      <p className="pt-4 text-[15px] font-semibold text-text">
        <span aria-hidden="true" className="text-accent">&#10022; </span>
        Fundamento del proyecto
      </p>
      {props.fase === 'cargando' ? <Cargando /> : null}
      {props.fase === 'error' ? <ErrorFundamento texto={props.error} /> : null}
      {props.fase === 'existe' ? <Existe texto={props.existente} /> : null}
      {props.fase === 'propuesta' && props.propuesta ? (
        <VistaPropuesta propuesta={props.propuesta} />
      ) : null}
    </>
  );
}

function Cargando() {
  return (
    <p className="mt-1 text-[13px] text-text-soft">Generando el draft con tu AI...</p>
  );
}

function ErrorFundamento(props: { texto: string | null }) {
  return (
    <p role="alert" className="mt-1 text-[13px] text-danger">{props.texto}</p>
  );
}

/** vista del fundamento ya creado (regla v1: uno por proyecto); el texto de
 * la pagina tal como la server lo puede mostrar (sin datos sensibles) */
function Existe(props: { texto: string | null }) {
  return (
    <>
      <p className="mt-1 text-[13px] text-text-soft">
        Ya tienes fundamento en este proyecto:
      </p>
      <pre className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-card border border-border bg-surface px-3 py-2 text-[12px] leading-snug text-text">
        {props.texto ?? '-'}
      </pre>
    </>
  );
}
