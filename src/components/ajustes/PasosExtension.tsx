/** pasos exactos para instalar la extension en Chrome (copia sin tildes) */
export default function PasosExtension() {
  return (
    <div className="space-y-2">
      <ol className="list-decimal space-y-1.5 pl-5 text-[13px] leading-snug text-text-soft">
        <li>Descarga el ZIP y descomprimelo en una carpeta.</li>
        <li>
          Abre <code className="rounded bg-raised px-1">chrome://extensions</code> en Chrome.
        </li>
        <li>Activa &quot;Modo de desarrollador&quot; (arriba a la derecha).</li>
        <li>
          Pulsa &quot;Cargar desempaquetada&quot; y elige la carpeta donde ves{' '}
          <code className="rounded bg-raised px-1">manifest.json</code>.
        </li>
        <li>Abre la extension, pega la URL de Mente y el token que generes abajo.</li>
      </ol>
      <p className="text-[12px] leading-snug text-text-soft">
        Descomprime el ZIP: arrastrarlo sin descomprimir no funciona. Si Chrome no ve
        manifest.json, elige la carpeta correcta.
      </p>
    </div>
  );
}
