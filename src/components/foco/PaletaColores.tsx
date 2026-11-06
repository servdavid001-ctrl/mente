'use client';

import { COLORES_PROYECTO } from '@/lib/foco';

/** paleta de colores de proyecto (compartida: modal crear + tarjetas).
 * selection con aria-pressed y ring de acento, igual que la v1. */
export default function PaletaColores(props: {
  valor: string;
  onElegir: (hex: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-[12px] text-text-soft">Color</legend>
      <div className="flex flex-wrap gap-2">
        {COLORES_PROYECTO.map((opcion) => {
          const activo = opcion.hex === props.valor;
          return (
            <button
              key={opcion.hex}
              type="button"
              aria-label={`Color ${opcion.nombre}`}
              aria-pressed={activo}
              onClick={() => props.onElegir(opcion.hex)}
              className={`h-8 w-8 rounded-full border border-border ${
                activo ? 'ring-2 ring-accent ring-offset-2 ring-offset-raised' : ''
              }`}
              style={{ backgroundColor: opcion.hex }}
            />
          );
        })}
      </div>
    </fieldset>
  );
}
