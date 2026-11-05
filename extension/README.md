# Mente — extension de Chrome

Captura texto, links, selecciones y screenshots de cualquier pagina y los manda
a Mente. Sin build ni dependencias: es Manifest V3 puro.

## Instalar

1. Abre `chrome://extensions` en Chrome.
2. Activa **Modo de desarrollador** (arriba a la derecha).
3. Pulsa **Cargar desempaquetada** y elige esta carpeta `extension/`.
4. Abre Mente en `https://mente-ten-iota.vercel.app`, entra en **Foco** y en la
   tarjeta **Extension de Chrome** pulsa **Generar token**.
5. Copia el token en ese momento: no se vuelve a mostrar.
6. Pulsa el icono de la extension, pega la URL de Mente (se rellena la de
   produccion por defecto) y el token. Se guardan en `chrome.storage.local`.

Para desarrollo local cambia la URL a `http://localhost:3000` (ya esta en los
`host_permissions`).

## Uso

- **Guardar texto**: guarda la nota escrita en la Bandeja.
- **Guardar link**: guarda la URL de la pestana activa.
- **Guardar seleccion**: guarda el texto seleccionado en la pagina (incluye la
  URL como fuente).
- **Capturar pantalla**: envia la captura visible a la Biblioteca creativa.

Cada boton muestra el resultado y el token puede revocarse en cualquier momento
desde Mente / Foco.
