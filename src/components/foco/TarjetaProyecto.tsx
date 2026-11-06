import Link from 'next/link';
import MenuTarjeta from './MenuTarjeta';
import ProgresoTarjeta from './ProgresoTarjeta';
import type { Proyecto } from '@/lib/types';

/** plantilla unica de tarjeta (modulo 11, spec §1): bloque visual color +
 * iniciales grandes, nombre debajo, barra de tarea al pie. */
export default function TarjetaProyecto(props: {
  proyecto: Proyecto;
  ocupado: boolean;
  onPlegar: () => void;
}) {
  const { proyecto } = props;
  const iniciales = inicialesDe(proyecto.nombre);

  return (
    <div className="relative overflow-hidden rounded-card border border-border bg-surface shadow-sm">
      <MenuTarjeta
        nombre={proyecto.nombre}
        hrefDetalle={`/foco/${proyecto.id}`}
        deshabilitado={props.ocupado}
        onPlegar={props.onPlegar}
      />

      <Link
        href={`/foco/${proyecto.id}`}
        aria-label={`Abrir proyecto ${proyecto.nombre}`}
        className="flex h-full flex-col"
      >
        <div
          aria-hidden="true"
          className="flex h-28 items-center justify-center rounded-card md:h-40"
          style={{ backgroundColor: proyecto.color }}
        >
          <span className="font-display text-4xl font-bold text-white md:text-5xl">
            {iniciales}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-2.5">
          <p className="truncate text-[15px] font-semibold text-text">
            {proyecto.nombre}
          </p>
          <div className="mt-auto">
            <ProgresoTarjeta
              hechas={proyecto.tareasHechas ?? 0}
              total={proyecto.tareasTotal ?? 0}
            />
          </div>
        </div>
      </Link>
    </div>
  );
}

/** letras iniciales del nombre (max 2); fallback 'P' si el nombre no tiene letras */
function inicialesDe(nombre: string): string {
  const letras = nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra.charAt(0).toUpperCase())
    .join('');
  return letras.length > 0 ? letras : 'P';
}
