import SeccionAjustes from './SeccionAjustes';
import ChipEstado from './ChipEstado';

/** AI: solo estado booleano derivado del servidor; nunca expone claves */
export default function AjustesAI(props: { configurada: boolean }) {
  return (
    <SeccionAjustes
      id="ai"
      titulo="AI"
      descripcion="Clasifica y sugiere categoria, explica items y propone conexiones."
      chip={
        <ChipEstado tono={props.configurada ? 'ok' : 'neutro'}>
          {props.configurada ? 'Configurada' : 'No configurada'}
        </ChipEstado>
      }
    >
      <div className="space-y-2 text-[13px] leading-snug text-text-soft">
        <p>Nada se aplica sin tu toque. La app funciona sin AI.</p>
        <p>
          {props.configurada
            ? 'El servidor ya tiene una clave configurada. Se gestiona en las variables de entorno de Vercel.'
            : 'Para activarla, el servidor necesita una clave. Se configura en las variables de entorno de Vercel.'}
        </p>
        <p>
          Tu contenido se envia al proveedor de AI solo cuando pides una sugerencia o una
          explicacion. La clave nunca se muestra en la app.
        </p>
      </div>
    </SeccionAjustes>
  );
}
