/** mod 19 doc publica: permisos por conector, seguridad y limites v1.
 * Componente server, sin estado. */

const REPO = 'https://github.com/servdavid001-ctrl/mente';

export default function Cierre() {
  return (
    <section className="space-y-4 rounded-card border border-border bg-surface px-4 py-4 md:rounded-blob">
      <div className="space-y-1">
        <h2 className="font-display text-[20px] font-semibold leading-tight">
          4. Permisos por conector
        </h2>
        <p className="text-[14px] text-text-soft">
          Cada conector decide que herramientas le permites. En /ajustes, seccion Acceso
          para agentes, expande el token: veras las 9 herramientas con un interruptor cada
          una, mas acciones rapidas Todas/Ninguna. Guardado por cambio; lista vacia
          bloquea TODO. El servidor tambien cumple: tools/list solo ofrece lo permitido y
          tools/call rechaza lo demas.
        </p>
      </div>
      <div className="space-y-1">
        <h2 className="font-display text-[20px] font-semibold leading-tight">5. Seguridad</h2>
        <ul className="list-inside list-disc space-y-1 text-[14px] text-text-soft">
          <li>Tokens revocables en /ajustes (se borra el hash, no quedan copias).</li>
          <li>En base de datos solo vive el SHA-256 del token, jamas el token plano.</li>
          <li>Log auditable por accion (token_acciones) sin contenido sensible.</li>
          <li>Rate limit: 60 peticiones por minuto por token.</li>
          <li>Nada destructivo: lo mas fuerte es terminar_tarea (marca hecha).</li>
          <li>El user_id vive en el token: un conector nunca ve datos de otro usuario.</li>
        </ul>
      </div>
      <div className="space-y-1">
        <h2 className="font-display text-[20px] font-semibold leading-tight">6. Limites v1</h2>
        <ul className="list-inside list-disc space-y-1 text-[14px] text-text-soft">
          <li>Sin notificaciones push hacia los conectores: son los conectores los que
            preguntan.</li>
          <li>Sin busquedas de texto libre: las herramientas trabajan por proyecto, tarea
            e id.</li>
          <li>Sin streaming: respuestas JSON-RPC 2.0 stateless por HTTP.</li>
        </ul>
        <p className="text-[14px] text-text-soft">
          Bugs o ideas: repo de Mente en GitHub (<span className="break-all">{REPO}</span>).
        </p>
      </div>
    </section>
  );
}
