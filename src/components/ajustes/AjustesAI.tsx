'use client';

import type { EstadoCredencial } from '@/lib/ai/credenciales';
import SeccionAjustes from './SeccionAjustes';
import ChipEstado from './ChipEstado';
import FormularioCredencialAi from './FormularioCredencialAi';

/** AI: estado (proveedor + last4), gestion de clave y nota de privacidad */
export default function AjustesAI(props: { estado: EstadoCredencial }) {
  const { estado } = props;
  return (
    <SeccionAjustes
      id="ai"
      titulo="AI"
      descripcion="Clasifica y sugiere categoria, explica items y propone conexiones."
      chip={
        <ChipEstado tono={estado.configurada ? 'ok' : 'neutro'}>
          {estado.configurada ? 'Configurada' : 'No configurada'}
        </ChipEstado>
      }
    >
      <div className="space-y-4">
        <FormularioCredencialAi inicial={estado} />
        <div className="flex flex-wrap gap-3 text-[12px]">
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noreferrer"
            className="text-text-soft underline"
          >
            Obtener clave de OpenRouter
          </a>
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noreferrer"
            className="text-text-soft underline"
          >
            Obtener clave de OpenAI
          </a>
        </div>
        <p className="text-[13px] leading-snug text-text-soft">
          Tu clave se guarda cifrada en el servidor y nunca se envia al navegador. La
          transcripcion de audio usa OpenAI o el modelo de audio de OpenRouter.
        </p>
      </div>
    </SeccionAjustes>
  );
}
