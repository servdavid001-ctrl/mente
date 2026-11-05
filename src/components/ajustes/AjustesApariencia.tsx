'use client';

import { useState } from 'react';
import SeccionAjustes from './SeccionAjustes';
import Segmented from './Segmented';
import { useTema, type Tema } from '@/lib/preferencias';

function Muestra(props: { fondo: string }) {
  return (
    <span
      aria-hidden="true"
      className={`h-5 w-8 rounded border border-border ${props.fondo}`}
    />
  );
}

/** Apariencia: tema claro, oscuro o sistema (persistido, sin flash) */
export default function AjustesApariencia() {
  const { tema, cambiar } = useTema();
  const [anuncio, setAnuncio] = useState('');

  function alCambiar(valor: Tema) {
    cambiar(valor);
    const nombre = valor === 'claro' ? 'Claro' : valor === 'oscuro' ? 'Oscuro' : 'Sistema';
    setAnuncio(`Tema ${nombre} activado.`);
  }

  return (
    <SeccionAjustes
      id="apariencia"
      titulo="Apariencia"
      descripcion="Elige como se ve Mente. El cambio es inmediato."
    >
      <Segmented<Tema>
        legend="Tema"
        name="tema"
        valor={tema}
        onChange={alCambiar}
        opciones={[
          {
            valor: 'claro',
            etiqueta: 'Claro',
            muestra: <Muestra fondo="bg-[#F5F1E8]" />,
          },
          {
            valor: 'oscuro',
            etiqueta: 'Oscuro',
            muestra: <Muestra fondo="bg-[#1C1A17]" />,
          },
          {
            valor: 'sistema',
            etiqueta: 'Sistema',
            descripcion: 'Sigue tu dispositivo',
            muestra: <Muestra fondo="bg-gradient-to-r from-[#F5F1E8] to-[#1C1A17]" />,
          },
        ]}
      />
      <p role="status" className="mt-3 text-[12px] text-text-soft">
        {anuncio}
      </p>
    </SeccionAjustes>
  );
}
