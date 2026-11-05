# UI v2 — responsive, ajustes y distribucion

## Shell
- Movil (<768px): header 48px, bottom nav de 4 tabs, capture bar.
- Escritorio (>=768px): sidebar 240/256px con Foco/Bandeja/Biblioteca/Ajustes, email y logout; header 56px; bottom nav oculta; contenido con max-width por pantalla.
- Capture bar como dock centrado (46rem) solo en Bandeja.

## Pantallas
- Bandeja: lista `max-w-[46rem]`; acciones de conteo/archivadas en header desktop.
- Biblioteca: toolbar en fila; grid 2/3/4 columnas; detalle en 2 columnas desde `lg` con rail sticky.
- Foco: metricas, proyectos 2-up, rail de copiloto/extension en `xl`; detalle 2 columnas desde `lg`.
- Login/Registro: tarjeta centrada de 26rem.

## Ajustes (`/ajustes`)
Cuenta (email, cambiar contrasena, logout), Apariencia (Claro/Oscuro/Sistema), Extension (ZIP + tokens + pasos), App movil (PWA + APK + share-target), AI (estado sin exponer claves), Datos (export JSON), Acerca de.

## Tema
Variables `[data-theme="dark"]` en `globals.css`; persistencia en `localStorage['mente-tema']`; script pre-paint en `layout.tsx` para evitar flash; modo Sistema respeta `prefers-color-scheme`.

## Distribucion
- Extension: `/downloads/mente-extension.zip` (icons 16/32/48/128, MV3).
- APK: wrapper Capacitor (WebView) que carga produccion. Release `apk-1`; fuente en `mobile/`. Build documentada en `mobile/BUILD_APK.md`.
- CI: `docs/ci/android-apk.yml` listo, pendiente de token con scope `workflow` para moverlo a `.github/workflows/`.

## QA (produccion, 2026-11-05)
390/768/1440 sin overflow horizontal; sidebar/bottom nav segun breakpoint; biblioteca 4 columnas en 1440; ajustes con 7 secciones; tema oscuro persiste; export JSON 200; ZIP 200; release APK 200; 0 pageerrors.
