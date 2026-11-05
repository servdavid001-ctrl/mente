# Modulo 6 — Share-target movil

Compartir texto, enlaces y capturas desde cualquier app del movil hacia Mente
(PWA). No requiere extension ni app nativa.

## Piezas

| Pieza | Ruta |
|---|---|
| Manifest con `share_target` | `public/manifest.webmanifest` |
| Service worker minimo (sin cache) | `public/sw.js` |
| Registro del SW | `src/components/ServiceWorkerRegister.tsx` |
| Route handler POST | `src/app/compartir/route.ts` |
| Validacion y guardado | `src/lib/compartir.ts`, `src/lib/compartirServer.ts` |

## Que guarda

- **Con URL http/https valida** (<= 2048): idea tipo `link` en la bandeja,
  `fuente` = URL y `contenido` = texto o titulo compartido.
- **Sin URL, con texto o titulo**: idea tipo `texto` en la bandeja.
- **Con imagen** (jpeg/png/webp <= 10 MB): la sube a
  `biblioteca-media/<user_id>/<uuid>.<ext>` y crea una idea tipo `arte` en la
  biblioteca. Si ademas venia texto o URL, tambien se crea la idea de
  texto/link.
- **Sin nada valido**: vuelve a `/?compartir=vacio`.
- Si se compartio `proyecto=<uuid>` y el proyecto pertenece al usuario, la idea
  queda vinculada a ese proyecto.

El nombre del archivo se genera con `crypto.randomUUID()`. No se escriben
titulos, textos ni URLs en logs.

## Instalar el PWA en Android (Chrome)

Requisitos: la app debe servirse por HTTPS (produccion en Vercel) y el usuario
debe tener sesion iniciada.

1. Abre Mente en Chrome Android.
2. Menu de tres puntos → **Anadir a pantalla de inicio** (o **Instalar app**).
3. Abre la app instalada al menos una vez para que se registre `sw.js`.
4. Comprueba en `chrome://serviceworker-internals` (o DevTools remoto) que el
   service worker esta activo con scope `/`.

> El `share_target` solo aparece en el menu de compartir cuando el PWA esta
> instalado. En una pestana normal no se muestra.

## Probar el share

### Texto

1. Abre cualquier app (Notas, WhatsApp, navegador...).
2. Comparte un texto → elige **Mente**.
3. La app abre `/compartir`, guarda la idea y vuelve a `/?compartir=ok` con el
   aviso "Guardado en tu bandeja."

### Enlace

1. Comparte una URL desde Chrome → **Mente**.
2. Se crea una idea tipo `link` con la URL como fuente. Aparece en Bandeja.

### Captura de pantalla

1. Haz una captura y comparte la imagen → **Mente**.
2. Se sube a `biblioteca-media` y se crea una idea tipo `arte`; la app vuelve a
   `/biblioteca?compartir=ok` cuando solo se compartio la imagen.
3. Si el formato no es jpeg/png/webp o supera 10 MB, la imagen se descarta; si
   no habia texto, se vuelve a `/?compartir=vacio`.

## Limitaciones conocidas

- iOS Safari no soporta `share_target` con archivos.
- El service worker no cachea: si no hay red, el share falla.
- Chrome escritorio soporta share de texto/URL, no de archivos.
