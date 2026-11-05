# Handoff UI/UX — Responsive v2, Ajustes y Distribucion

Fecha: 2026-11-05
Autor: frontend-ui
Estado: propuesta lista para implementar
Alcance: shell responsive, pantallas en escritorio, panel `/ajustes`, instalacion de extension y app movil, sistema visual, criterios de aceptacion.

Documento autocontenido: no hace falta releer el repo para implementarlo. Los archivos a tocar estan listados en §8.

---

## 0. Resumen ejecutivo

| # | Bloque | Prioridad | Esfuerzo | Por que |
|---|---|---|---|---|
| 1 | Shell responsive real (sidebar md+, bottom nav solo movil, content max-width) | P0 | M | Es el problema raiz: hoy `AppShell` fija `max-w-md` y el bottom nav en todos los tamanos. |
| 2 | Ajustes `/ajustes` con Cuenta, Apariencia, Extension, App movil, AI, Datos, Acerca de | P0 | L | No existe panel; ademas es la casa natural de descargas y tokens. |
| 3 | Descarga de extension (ZIP + pasos) y bloque PWA/APK | P0 | S | Hoy el usuario no tiene forma visible de instalar nada. |
| 4 | Correccion de contraste (tokens `--accent-strong`, `--on-accent`, `--focus`, `--border-control`) | P0 | S | Varios pares actuales no llegan a AA (blanco sobre `#E86A33` = 3.4:1). |
| 5 | Biblioteca desktop (toolbar, grid 2/3/4, detalle 2 columnas) | P1 | M | Aprovechar ancho sin perder escaneo. |
| 6 | Foco desktop (metricas, proyectos en grid, rail de copiloto/extension, detalle 2 columnas) | P1 | M | La pantalla mas pobre en escritorio. |
| 7 | Tema oscuro + densidad persistidos | P1 | M | Pedido explicito en Apariencia; requiere tokens y script anti-flash. |
| 8 | Iconos PWA 192/512/maskable + boton de instalacion | P1 | S | Sin ellos Chrome no ofrece "Instalar app"; el bloque App movil quedaria vacio. |
| 9 | Exportar datos JSON (endpoint nuevo de solo lectura) | P1 | S | Pedido explicito; requiere aprobacion del CTO por ser capacidad nueva. |
| 10 | Densidad aplicada a todas las cards y listas | P2 | S | Mejora percibida; no bloquea. |
| 11 | APK Android real (TWA/Capacitor) | P2 | XL | No existe proyecto Android en el repo; requiere pipeline aparte y decision de David. |

**Regla de esta iteracion:** no se cambia el contrato funcional existente (ideas, categorizar, proyectos, objetivos, tareas, tokens, share-target). Todo lo nuevo es aditivo: 4a tab, ruta `/ajustes`, endpoint de export. Sin dependencias nuevas.

---

## 1. Diagnostico y principios

### 1.1 Que esta mal hoy (evidencia en codigo)

| Sintoma | Causa concreta |
|---|---|
| En escritorio se ve un movil estirado | `AppShell` envuelve todo en `mx-auto flex h-[100dvh] max-w-md flex-col` (28rem). |
| Navegacion pobre en escritorio | `BottomNav` se renderiza siempre, con 3 tabs de 64px, sin sidebar. |
| No hay ajustes | No existe ruta; logout vive suelto en el header. |
| No hay forma de instalar la extension | Solo un `<details>` con 3 pasos dentro de `ExtensionCard`; no hay descarga ni guia completa. |
| No hay APK | No existe `android/`, `capacitor.config.*` ni release con `.apk`. |
| Contraste insuficiente | Botones `bg-accent text-white` (3.4:1) y bordes de input (`--border` sobre `--surface` = 1.3:1). |
| PWA no instalable en Chrome | `manifest.webmanifest` solo declara un SVG `sizes: any`; faltan 192/512 y maskable. |

### 1.2 Principios aplicados (marco de 6 pilares)

1. **Hook / Core Loop:** el loop es capturar → clasificar → foco → tarea. El shell no debe interponerse; en escritorio se gana velocidad con navegacion lateral persistente y captura siempre a un gesto. (Core Loop + Progressive Investment)
2. **Fogg B=MAP:** en escritorio la Ability sube con sidebar fija, atajos visibles y composer en una sola fila; el Prompt (captura) permanece en Bandeja. (Fogg)
3. **Nielsen:** visibilidad de estado (sidebar activa, secciones con estado), control y libertad (logout y revocar token a 2 toques), prevencion de errores (confirmar contrasena, no prometer APK inexistente).
4. **Krug:** convenciones antes que invencion: sidebar izquierda, 4 tabs, tarjeta de login centrada, ajustes en secciones apiladas. Todo se entiende en menos de 5 segundos.
5. **Delight (Aarron Walter):** primero funcional y fiable; el placer va en detalles sobrios (hover de elevation, subrayado activo, micro-fade), nunca en friccion ni en animacion decorativa.
6. **Friccion intencional:** solo en acciones irreversibles (cerrar sesion, revocar token, eliminar) y en la creacion de contrasena (confirmacion + minimo 12).

---

## 2. Shell responsive

### 2.1 Breakpoints

Tailwind por defecto. No se anaden pantallas nuevas.

| Token | min-width | Shell | Sidebar | Bottom nav | Gutter | Captura |
|---|---|---|---|---|---|---|
| base | 0 | movil | oculta | visible (4 tabs) | 16px | sobre bottom nav, siempre visible |
| `md` | 768px | escritorio | 240px (`w-60`) | oculta (`md:hidden`) | 24px | dock inferior dentro de la columna |
| `lg` | 1024px | escritorio | 256px (`lg:w-64`) | oculta | 32px | dock |
| `xl` | 1280px | escritorio | 256px | oculta | 32px | dock |
| `2xl` | 1536px | igual | igual | igual | 32px | dock |

Decisiones:
- **768 es el corte.** Un tablet vertical a 768 ya tiene ancho para sidebar; por debajo, la esencia movil se conserva.
- **La columna movil mantiene `max-w-md` centrada** (28rem, comportamiento actual). El bug no era el ancho movil, era aplicarlo tambien en escritorio. Regla: `max-w-md md:max-w-none`.
- **No usar `overflow-x: hidden` global** como parche. Cada desbordamiento se corrige en su componente (ver §9).

### 2.2 Estructura TO-BE

Movil (<768):

```
+--------------------------------------+
| (safe-area top)                      |
| Header 48px: [←] titulo      [salir] |
+--------------------------------------+
| main scrollable (px-4 pt-5)          |
|                                      |
|                                      |
+--------------------------------------+
| Undo / toast (si aplica)             |
| CaptureBar (solo Bandeja)            |
+--------------------------------------+
| BottomNav 64px + safe-area (4 tabs)  |
+--------------------------------------+
```

Escritorio (>=768):

```
+----------+-------------------------------------------+
| mente    | Seccion             acciones / conteo     |  header 56px
|          +-------------------------------------------+
| ○ Foco   | main scrollable                           |
| ▣ Bandeja|   content max-width + gutter              |
| ▤ Biblio |                                           |
| ⚙ Ajustes|                                           |
|          |                                           |
|          +-------------------------------------------+
|          | dock captura (solo Bandeja, 736px max)    |
|----------+-------------------------------------------+
| email    |
| Cerrar   |
+----------+
  sidebar
  240/256
```

### 2.3 `AppShell` (modificar)

Responsabilidades nuevas:
- Dos disposiciones: movil (columna con header/nav) y escritorio (sidebar + columna).
- Slot `acciones?: ReactNode` para el header de escritorio.
- Mantener `headerLeft` y `titulo` actuales.
- Skip link "Saltar al contenido" visible solo con foco de teclado, primer elemento del DOM, apunta a `#contenido`.
- `main` con `id="contenido"`, `flex-1 min-w-0 overflow-y-auto`.
- Sidebar fuera del area scrolleable; header de seccion fuera del scroll (siempre visible).
- Bottom nav solo `md:hidden` (no basta `hidden` por breakpoint mal aplicado; debe desaparecer del arbol de accesibilidad en escritorio).

Reglas de layout:
- Raiz: `flex h-[100dvh] w-full`.
- Envoltura movil de contenido: `mx-auto w-full max-w-md md:max-w-none` aplicada a header + main + capture (no al sidebar).
- Sidebar: `hidden md:flex md:w-60 lg:w-64 shrink-0 flex-col border-r border-border bg-surface`.
- Columna: `flex min-w-0 flex-1 flex-col`.
- Header movil: `h-12 px-4` (sin cambio). Header escritorio: `h-14 px-6 lg:px-8` con titulo `font-display text-[22px] lg:text-2xl`.
- Contenido: cada pantalla define su `max-w` con `mx-auto w-full` (tabla §2.4).
- `padding-bottom` del main en movil: 16px + safe-area si hay capture; en escritorio 24px, sin safe-area.

### 2.4 Anchos maximos por pantalla

| Pantalla | Max width | Justificacion |
|---|---|---|
| Bandeja | `46rem` (736px) | Lista de lectura; >75ch cansa. |
| Biblioteca (grid) | `75rem` (1200px) | Permite 4 columnas reales a 1280. |
| Foco | `75rem` | Idem, con rail a `xl`. |
| Detalle item / proyecto | `64rem` (1024px) | 2 columnas comodas. |
| Ajustes | `48rem` (768px) | Formularios y textos; una columna. |
| Login / Registro | `26rem` (416px) | Tarjeta centrada, nunca estirada. |

### 2.5 Sidebar (`DesktopSidebar`, nuevo)

| Zona | Contenido | Especificacion |
|---|---|---|
| Marca | "mente" en display serif, 24px, lowercase, + punto accent | `px-5 pt-6 pb-5` |
| Navegacion | Foco, Bandeja, Biblioteca, Ajustes | `<nav aria-label="Principal">`, items de 44px, `gap-1`, radio 12, icono 20px + label 14px semibold |
| Activo | `bg-accent-soft text-text`, icono `accent-ink`, barra interior 2px `accent` a la izquierda | `aria-current="page"` |
| Inactivo | `text-text-soft`, hover `bg-raised` solo en `hover:hover` | |
| Footer | email (12px, truncado con texto completo en nodo oculto), boton "Cerrar sesion" 44px | `border-t border-border px-5 py-4` |

- Orden identico al bottom nav (Foco, Bandeja, Biblioteca, Ajustes) para evitar re-aprendizaje.
- No se anade boton de captura al sidebar en P0. P2 opcional: "Capturar" que navega a `/` y enfoca el composer (sin cambio de contrato; solo foco).
- Estado AI: P2 como chip discreto encima del footer ("AI sin clave"), no bloquea.

### 2.6 Bottom nav (modificar)

- 4 items: Foco, Bandeja, Biblioteca, Ajustes.
- Altura 64px + safe-area; area tactil >=44px; icono 24 + label 12.
- Activo: `text-text` + barra de 20x2px `accent`; inactivo `text-text-soft`.
- `aria-label` por item ("Ir a Foco", "Ir a la Bandeja de entrada", "Ir a la Biblioteca", "Ir a Ajustes").
- `md:hidden`.

### 2.7 Header por contexto

| Pantalla | Movil | Escritorio |
|---|---|---|
| Bandeja | "Mente" o "Bandeja" + icono salir | "Bandeja" + acciones (conteo, Ver archivadas) |
| Biblioteca | "Biblioteca" | "Biblioteca" + conteo de items |
| Foco | "Foco" | "Foco" + accion "Nuevo proyecto" (P2) |
| Detalle | `←` + titulo truncado | `←` + breadcrumb "Foco / Proyecto" + acciones |
| Ajustes | "Ajustes" + icono salir | "Ajustes" |

- El icono de salir se mantiene en movil (no hay regresion); en escritorio el logout vive en el footer del sidebar y en Ajustes > Cuenta.
- Titulos largos: `truncate` + `min-w-0`; nunca empujan las acciones.

### 2.8 Capture car (modificar)

| Aspecto | Movil | Escritorio |
|---|---|---|
| Posicion | Sobre bottom nav, full width de la columna | Dock inferior de la columna, debajo del scroll |
| Ancho | 100% con `px-3 py-2` | `mx-auto max-w-[46rem] px-0 py-3` |
| Fila | 2 filas (input + botones) como hoy | 1 fila: input flexible + mic + link + enviar, alto 48px |
| Link pegado | Pill con favicon + dominio + quitar | Igual, dentro de la fila |
| Grabando | Reemplaza input con "Escuchando..." | Igual, dentro de la fila |
| Undo / toast | Encima del composer, dentro del bloque | Encima del composer, mismo ancho max |
| Fondo | `bg-surface border-t` | `bg-bg border-t` con `pt-3 pb-3` |

- Sigue siendo exclusiva de Bandeja.
- El composer nunca se oculta al hacer scroll; en escritorio queda fijo al pie de la columna.
- Sin cambios de comportamiento (Enter envia, texto se conserva si falla, haptic).

---

## 3. Pantallas en escritorio

### 3.1 Bandeja

**Jerarquia visual:** 1) composer (accion principal del producto), 2) lista de ideas, 3) acciones secundarias (archivadas), 4) banners informativos.

| Elemento | Escritorio |
|---|---|
| Header | Titulo "Bandeja" 22px; derecha: "12 ideas" (12px soft) + boton "Ver archivadas (n)" (texto, 13px, 44px alto) |
| Banners (AI / aviso compartir) | Max 46rem, radio 16, padding 12-16; no ocupan todo el ancho |
| Lista | `max-w-[46rem]`, `space-y-3` (comoda) o `space-y-2` (compacta) |
| Card | `p-5` en comoda / `p-3.5` en compacta; misma estructura actual |
| Acciones por card | Igual (menu `⋯`, badge categorizar); targets >=40px en desktop |
| Composer | Dock de 1 fila, 736px max |
| Empty | Centrado dentro de 46rem, `pt-16`; mismo copy (corregir "descanza" → "descansa") |

**No** se anade segunda columna de detalle en Bandeja: la lista es el trabajo; abrir una idea sigue siendo el gesto (categorizar sheet). Evita duplicar estado y mantiene foco.

Estados:

| Estado | Diseno |
|---|---|
| Loading | 3 esqueletos de card (no spinner centrado), mismo ancho que la lista |
| Empty | `EmptyState` "Tu cerebro descansa tranquilo." + descripcion + ancla abajo |
| Error | Banner inline `bg-accent-soft` + boton "Reintentar"; el composer sigue usable |
| Success | Card optimista arriba + input limpio. Sin toast: el silencio es el exito (Delight funcional) |
| Envio fallido | Toast danger + el texto permanece en el composer |

### 3.2 Biblioteca

**Jerarquia:** 1) grid de items, 2) busqueda, 3) filtros de tipo/coleccion, 4) archivadas.

Toolbar en escritorio (`lg`): una fila
- Busqueda: `w-[18rem]` fija, no crece sin limite (evita input gigante).
- Segmento de tipo: alto 40, mismo componente.
- Empuje a la derecha: toggle "Ver archivadas (n)".
- Segunda fila: chips de colecciones con `flex-wrap` (en movil, scroll horizontal como hoy).

Grid:

| Breakpoint | Columnas | Ancho aproximado de card | Gap |
|---|---|---|---|
| base | 2 | 160-220 | 8px |
| `md` (768) con sidebar 240 | 2 | 232 | 12px |
| `lg` (1024) | 3 | 221 | 12px |
| `xl` (1280) | 4 | 226 | 16px |
| `2xl` (1536) | 4 | 266 | 16px |

- Regla: `grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` y `minmax(0,1fr)` implicito via `min-w-0` en cards.
- Nunca 3 columnas a 768: con sidebar quedan 480px y la card baja de 160px.
- La cubierta mantiene ratio 1:1; textos con `truncate`.

Detalle `/biblioteca/[id]` en `lg`+:

```
+-----------------------------------------------------+
| ← Detalle                     [Explicar con AI]     |
+-----------------------------------------------------+
| main (minmax(0,1fr))          | aside 20rem sticky   |
| HeroItem (media max-h 420)    | Metadatos            |
| Nota (editor / visual)        | Crear tareas         |
| Conexiones                    | Conectar con...      |
| Expansion                     | Acciones (archivar,  |
|                               | eliminar)            |
+-----------------------------------------------------+
```

- Aside `lg:sticky lg:top-6 self-start`; gap 32.
- FAB `✦` se oculta en `lg` (`lg:hidden`) y aparece boton "Explicar con AI" en el aside. Evita un flotante lejos del contenido.
- En `md` todo apila en una columna (max 64rem).

Estados:

| Estado | Diseno |
|---|---|
| Loading | Esqueleto de grid con las mismas columnas (2/3/4) |
| Empty sin items | "Tu biblioteca esta prendiendo." + CTA a Bandeja |
| Empty con filtros | "Nada con esos filtros." + "Limpiar filtros" |
| Error | Banner + "Reintentar" |
| Success | Item aparece/actualiza; sin toast salvo error |
| Detalle inexistente | Redirige a `/biblioteca` (contrato actual) |

### 3.3 Foco

**Jerarquia:** 1) estado de atencion (metricas + guardian), 2) Hoy, 3) proyectos, 4) herramientas (copiloto, extension).

Layout:

| Breakpoint | Disposicion |
|---|---|
| base / md | Una columna: metricas, guardian, Hoy, desplegados, guardados, crear, extension, copiloto |
| `lg` (1024) | Una columna max 75rem; proyectos en `lg:grid-cols-2`; metricas 3 columnas |
| `xl` (1280) | `grid grid-cols-[minmax(0,1fr)_20rem] gap-8`: main + rail |

Rail `xl` (sticky, `top-6`):
1. Copiloto (card).
2. Extension (card compacta: descargar ZIP + "Gestionar en Ajustes").
3. (P2) chip de estado AI.

Metricas:
- 3 cards iguales; numero en display 30/36, label overline 11 uppercase `text-soft`.
- Altura minima 88px; a `lg` se pueden alinear en horizontal numero-izquierda/label-derecha si el ancho lo permite, pero mantener 3 columnas siempre.
- Sin color de acento de fondo: el acento se reserva para la accion.

Proyectos:
- Seccion "Desplegados" y "Guardados" con overline 12 uppercase.
- `lg:grid-cols-2` dentro del main; card de 72-80px de alto, dot de color, nombre 16 semibold truncado, conteos 12 soft, accion "Plegar/Desplegar" 44px.
- El grid no se usa a `md` (232px por card seria ilegible).
- `CrearProyectoInline` como card con borde; en `xl` va al final del main, no al rail (es una accion primaria del loop).

Detalle `/foco/[id]` en `xl`:

```
+-----------------------------------------------------+
| ← Foco / Proyecto        [Plegar]                   |
| HERO: dot, nombre 26px, conteos, estado             |
+-----------------------------------------------------+
| main (minmax(0,1fr))          | aside 20rem          |
| Objetivos                     | Ideas del proyecto   |
| Tareas                        | Volver a Foco        |
+-----------------------------------------------------+
```

- `ProyectoHeader` pasa a hero full width: nombre 24/28 display, conteos 13, dot 12, accion a la derecha.
- En `lg` una columna; en `xl` dos.
- `IdeasProyecto` en rail evita competir con objetivos/tareas, que son el trabajo del proyecto.

Estados:

| Estado | Diseno |
|---|---|
| Loading | Esqueleto de metricas + 3 cards |
| Empty sin proyectos | "Tu Foco empieza con un proyecto." + formulario visible |
| Empty Hoy | "Nada para hoy. Tu dia esta libre." (ya existe) |
| Error | Banner danger + "Reintentar" |
| Success | Proyecto/objetivo aparece; el panel de objetivo creado confirma |
| Detalle inexistente | "Ese proyecto no existe." + volver |

### 3.4 Login y Registro

- Pagina: `min-h-[100dvh] grid place-items-center px-6 py-10`; fondo `--bg`.
- Tarjeta: `w-full max-w-[26rem]`, `bg-surface`, `border`, radio 24, `p-6 md:p-8`, `shadow-card`.
- Movil (<768): sin cromo de tarjeta (fondo transparente, sin borde ni sombra) para conservar la ligereza actual; en `md` aparece la tarjeta.
- Contenido: wordmark "mente" (display serif 24, con punto accent) + h1 30/36 + subtitulo 15 soft + form.
- Form: gap 16; inputs 48px; labels 13 soft; boton primario 48px full; enlace secundario centrado.
- No se estira a 1440: la tarjeta queda centrada con aire.
- Registro: campos correo, contrasena (min 12, hint "Minimo 12 caracteres."), codigo de invitacion (helper "Te lo dio David.").
- Accesibilidad: `autocomplete` correcto, error `role="alert"`, focus visible, labels asociados.

Estados:

| Estado | Diseno |
|---|---|
| Loading | Spinner dentro del boton; boton deshabilitado 60% |
| Empty | No aplica: el formulario es el estado inicial (justificado) |
| Error | Mensaje inline danger + shake 320ms (reducido a nada con reduced motion) |
| Success | Redireccion a `/` (sin toast) |

---

## 4. Panel de Ajustes (`/ajustes`)

### 4.1 Arquitectura de informacion

Ruta protegida por el proxy actual (no esta en la lista exenta: no requiere cambios en `proxy.ts`). Usa `AppShell` con `activeTab="ajustes"` y `titulo="Ajustes"`.

Encabezado de pagina: titulo "Ajustes" + subtitulo "Tu cuenta, tu app, tus datos."

Secciones, en este orden:

1. **Cuenta**
2. **Apariencia**
3. **Extension**
4. **App movil**
5. **AI**
6. **Datos**
7. **Acerca de**

Cada seccion es una card (`bg-surface border rounded-card p-5 md:p-6`) con:
- `h2` display 20px.
- Descripcion 13px soft (una linea).
- Contenido.
- Chip de estado opcional a la derecha del titulo (ej. "3 tokens", "Sin configurar").

Ancho de pagina: 48rem, `space-y-4 md:space-y-5`. Navegacion: sidebar (escritorio) y 4a tab (movil). No se anade sub-nav interna ni anclas: 7 secciones se escanean bien.

### 4.2 Cuenta

| Bloque | Contenido | Notas |
|---|---|---|
| Identidad | Label "Correo", valor del usuario, chip "Sesion iniciada" | Valor con `break-all` para correos largos |
| Cambiar contrasena | Disclosure "Cambiar contrasena" (boton 44px) que expande formulario | Colapsado por defecto: no es una tarea frecuente |
| Formulario | "Contrasena nueva" (min 12), "Repite la contrasena", boton "Guardar contrasena" | `autocomplete="new-password"`; submit deshabilitado hasta que coincidan y cumplan minimo |
| Helper | "Minimo 12 caracteres. Si no coincides, no se guarda." | Prevencion de error |
| Logout | Boton outline danger "Cerrar sesion" con confirmacion a 2 toques inline | Primer toque: "Cerrar sesion" → "Seguro? Toca de nuevo" (4s) |

Estados:
- Loading: boton con spinner; inputs deshabilitados.
- Empty: no aplica (siempre hay email).
- Error: inline `role="alert"` bajo el formulario, con el mensaje del proveedor traducido a lenguaje simple.
- Success: `role="status"` "Contrasena actualizada." y el formulario se colapsa.

### 4.3 Apariencia

| Control | Opciones | Comportamiento |
|---|---|---|
| Tema | Claro · Oscuro · Sistema | Aplica al instante; persiste en `localStorage['mente-tema']`; "Sistema" sigue `prefers-color-scheme` y escucha cambios |
| Densidad | Comoda · Compacta | Persiste en `localStorage['mente-densidad']`; ajusta padding de cards y gaps de listas |

- Control segmentado implementado con radios nativos visualmente ocultos dentro de un `fieldset` + `legend` (accesible por teclado y lectores).
- Cada opcion incluye una muestra visual (mini card) ademas del texto: no depender solo del color.
- Sin boton "Guardar": el cambio es inmediato. Anuncio `role="status"` ("Tema oscuro activado.").
- No hay parpadeo: script inicial en `<head>` (antes del paint) que resuelve tema y densidad desde localStorage y aplica `data-theme` y `data-densidad` en `<html>`.
- `color-scheme` CSS para que los controles nativos (scrollbars, date, password) sigan el tema.
- `theme-color` del navegador: dos meta con `media="(prefers-color-scheme: light/dark)"`.

### 4.4 Extension

| Bloque | Contenido |
|---|---|
| Estado | "Extension de Chrome v1.0.0" + chip "Instalacion manual" (no se puede detectar si esta instalada; no mentir) |
| Descarga | Fila con nombre `mente-extension.zip`, peso y boton "Descargar ZIP" (`<a download>`) |
| Pasos | Lista numerada 1-5 (ver §5.1) visible, no escondida |
| Tokens | Boton "Generar token", panel de token nuevo (se muestra una vez, copiar), lista de tokens con nombre, creado, ultimo uso y "Revocar" (2 toques) |
| Ayuda | "Si el token deja de funcionar, revocalo y genera otro." |

Reutiliza `useTokensExtension` y `TokensExtensionList` (mismo contrato). La tarjeta de Foco sigue existiendo, pero enlaza a esta seccion para la guia completa.

Estados:
- Loading: linea "Cargando tokens..." (no bloquear la descarga ni los pasos).
- Empty: "Aun no hay tokens." + CTA "Generar token".
- Error: inline danger + "Reintentar".
- Success: token nuevo visible una vez; copiar anuncia "Copiado".

### 4.5 App movil

| Bloque | Contenido |
|---|---|
| PWA | Explicacion "Instala Mente en tu telefono. Se abre como app y comparte capturas." + boton "Instalar en este dispositivo" (solo si `beforeinstallprompt` esta disponible) + instrucciones de respaldo por plataforma |
| Share target | "Comparte desde cualquier app y elige Mente para guardar el link, el texto o una imagen." Requiere PWA instalada |
| APK | Fila "APK para Android" con estado real (ver §5.2): descarga si hay URL configurada, o "En preparacion" si no |

Estados:
- PWA instalada: el boton desaparece y se muestra "Ya esta instalada." (detectable con `display-mode: standalone`).
- PWA no instalable (iOS o navegador sin prompt): se muestran pasos, sin boton muerto.
- APK no disponible: fila atenuada, sin enlace, con copy honesto + recomendacion de PWA.
- Error de instalacion: mensaje breve "No se pudo abrir el instalador. Usa el menu del navegador."

### 4.6 AI

| Bloque | Contenido |
|---|---|
| Estado | Operativa / No configurada / Error, con punto + texto (nunca solo color) |
| Que hace | "Clasifica y sugiere categoria, explica items y propone conexiones. Nada se aplica sin tu toque." |
| Si no esta configurada | "La app funciona sin AI. Para activarla, el servidor necesita una clave." |
| Privacidad | "Tu contenido se envia al proveedor de AI solo cuando pides una sugerencia o una explicacion." |

- P0: estado explicado en texto, sin sonda de red (no hay endpoint de estado). Se puede derivar del ultimo resultado conocido o mostrar el texto base.
- P2 opcional: `GET /api/ai/estado` con `{ disponible: boolean }` para un chip real.
- No se pide la clave en la UI: vive en variables de entorno del servidor (no exponerla).

### 4.7 Datos

| Bloque | Contenido |
|---|---|
| Exportar | "Descarga todo lo tuyo en un archivo JSON." Boton "Exportar mis datos" |
| Incluye | ideas, colecciones, conexiones, proyectos, objetivos, tareas |
| Privacidad | "El archivo se genera con tu sesion. No se envia a ningun sitio." |

- Requiere endpoint nuevo de solo lectura `GET /api/exportar` (auth obligatoria, RLS por usuario). **Capacidad nueva pedida por David: aprobar antes de construir.**
- Nombre del archivo: `mente-export-AAAA-MM-DD.json`.
- Estados: loading (boton spinner + "Preparando..."), error (inline + reintentar), success ("Descarga iniciada." `role="status"`).
- Empty: si no hay datos, el JSON se genera igual con arrays vacios (no es un error).

### 4.8 Acerca de

- Wordmark + "Mente v0.1.0" (version real de `package.json`).
- "Un sistema personal de captura y foco. Solo para ti."
- Datos: "Alojado en Supabase (us-east-1)."
- Version de extension: 1.0.0 (de `extension/manifest.json`).
- Sin enlaces externos que no existan.

### 4.9 Estados globales y accesibilidad de Ajustes

- La pagina no tiene loading global: sus secciones son estaticas; solo los datos remotos (tokens) cargan.
- Todos los formularios: label visible, `aria-describedby` para helpers, error `role="alert"`, exito `role="status"`.
- Confirmaciones destructivas: nunca modal sorpresa; 2 toques inline con tiempo de expiracion (4s) y texto que cambia.
- Teclado: orden natural por secciones; el disclosure de contrasena usa `aria-expanded` y `aria-controls`.
- Targets: >=44px en movil, >=40px en escritorio; el texto de los botones es el nombre accesible (sin `aria-label` redundante).
- Los segmentados son radios nativos: flechas cambian, `Tab` sale del grupo.

---

## 5. Instalacion: extension y app movil

### 5.1 Extension de Chrome (P0)

Artefacto: `public/downloads/mente-extension.zip` con los 4 archivos de `extension/` en la **raiz** del ZIP (`manifest.json`, `popup.html`, `popup.css`, `popup.js`). Sin carpeta contenedora: si el usuario descomprime y elige la carpeta equivocada, Chrome no ve el manifest.
Generacion: script de build o commit manual del ZIP; no se genera en runtime.

Pasos exactos en la UI (copiar sin tildes):

1. Descarga el ZIP y descomprimelo en una carpeta.
2. Abre `chrome://extensions` en Chrome.
3. Activa "Modo de desarrollador" (arriba a la derecha).
4. Pulsa "Cargar desempaquetada" y elige la carpeta donde ves `manifest.json`.
5. Abre la extension, pega la URL de Mente y el token que generes abajo.

Notas de UI:
- Diferenciar explicitamente **descomprimir** de **arrastrar el ZIP**: arrastrar el ZIP no funciona.
- La URL por defecto ya es produccion; en local se cambia a `http://localhost:3000`.
- El token se pega en el popup y se guarda en `chrome.storage.local`.
- Errores frecuentes, en una linea cada uno: "No veo manifest.json → elige la carpeta correcta."; "401 → token revocado o mal pegado."; "No guarda → revisa que la URL coincida con la de Mente."
- Si falla la descarga del ZIP: `role="alert"` "No se pudo descargar. Reintenta." + enlace directo como respaldo.

Ubicacion de enlaces:
- Primario: Ajustes > Extension.
- Secundario: tarjeta "Extension de Chrome" de Foco (enlace "Descargar ZIP" + "Guia completa en Ajustes").
- El enlace es un `<a href="/downloads/mente-extension.zip" download>` real, no un boton con JS.

### 5.2 App movil: PWA (P1) y APK (P2)

**PWA (ruta que funciona hoy):**
1. Abre Mente en Chrome Android con la sesion iniciada.
2. Menu de tres puntos → "Instalar app" (o "Anadir a pantalla de inicio").
3. Abre la app instalada una vez para registrar el service worker.
4. Ya puedes compartir desde otras apps hacia Mente.

Requisitos tecnicos que faltan para que Chrome ofrezca la instalacion:
- Iconos PNG 192x192 y 512x512, y una variante `purpose: maskable` 512.
- `manifest.webmanifest` con `display: standalone` (ya esta), `start_url` (ya esta), nombre y colores (ya estan).
- HTTPS (ya esta en produccion).

**APK (honestidad primero):**
- Hoy **no existe** proyecto Android ni APK. La UI no puede prometer una descarga que dara 404.
- Fuente de verdad: constante `NEXT_PUBLIC_APK_URL` (o similar). Si esta vacia, la fila muestra "APK en preparacion" sin enlace.
- Copy cuando no hay APK: "La PWA hace lo mismo y se actualiza sola. El APK llegara mas adelante."
- Cuando exista: boton "Descargar APK (vX, Y MB)" + aviso "Android pedira permitir la instalacion desde esta fuente." + fecha.
- Producir el APK no es parte de esta iteracion: requiere TWA (Bubblewrap) o Capacitor, firma, `assetlinks.json` en `/.well-known/`, y pipeline de build. Decision de David; P2 y fuera del alcance de "sin dependencias nuevas".

Comunicacion de estado:
- PWA: boton solo si es instalable; si ya esta instalada, "Ya esta instalada."
- APK: chip "En preparacion" (soft) o "Disponible" (success) + peso/version.
- Nunca un boton deshabilitado sin explicacion.

---

## 6. Sistema visual

### 6.1 Tokens (anadir a `globals.css` y mapear en Tailwind solo lo necesario)

Mantener la identidad: crema calido, serif display, sans humanista, **un solo acento**.

Claro (por defecto):

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#F5F1E8` | Fondo app |
| `--surface` | `#FDFBF6` | Cards, sidebar |
| `--surface-raised` | `#FFFFFF` | Inputs, overlays |
| `--text` | `#2B2822` | Texto principal |
| `--text-soft` | `#6B665C` | Secundario (5.1:1 sobre bg) |
| `--accent` | `#E86A33` | Marca, decoracion, subrayados; **nunca texto pequeno** (2.8:1) |
| `--accent-soft` | `#FBEEE6` | Fondos de estado/seleccion |
| `--accent-strong` | `#C6541F` | Relleno de botones primarios (6.1:1 con blanco) |
| `--accent-hover` | `#B84A1B` | Hover del primario (5.2:1 con blanco) |
| `--accent-ink` | `#B84A1B` | Texto/icono accent sobre crema (4.6:1) |
| `--on-accent` | `#FFFFFF` | Texto sobre `--accent-strong` |
| `--danger` | `#B3573F` | Error/eliminar (4.8:1 con blanco) |
| `--danger-hover` | `#9E4632` | Hover danger |
| `--on-danger` | `#FFFFFF` | Texto sobre danger |
| `--border` | `#E4DECF` | Hairlines decorativos |
| `--border-control` | `#9A9180` | Bordes de inputs (3.0:1 sobre surface) |
| `--focus` | `#B84A1B` | Outline de foco (4.6:1 sobre bg; 3:1 minimo) |
| `--shadow-card` | `0 1px 2px rgba(43,40,34,.04), 0 4px 12px rgba(43,40,34,.05)` | Cards |
| `--shadow-pop` | `0 8px 24px rgba(43,40,34,.10)` | Sheets, hover elevado |

Oscuro (`[data-theme="dark"]`):

| Token | Valor | Nota |
|---|---|---|
| `--bg` | `#1C1A17` | Nunca negro puro |
| `--surface` | `#24211D` | Cards |
| `--surface-raised` | `#2C2823` | Inputs, elevados |
| `--text` | `#F2EDE3` | 15:1 sobre bg |
| `--text-soft` | `#B3AB9D` | 7.1:1 sobre surface |
| `--accent` | `#F0844F` | 6.8:1 sobre bg |
| `--accent-soft` | `#3A2A22` | 11.8:1 con text |
| `--accent-strong` | `#F0844F` | Relleno |
| `--accent-hover` | `#E5773F` | |
| `--accent-ink` | `#F5A277` | Texto accent |
| `--on-accent` | `#1C1A17` | Tinta oscura sobre naranja claro (6.8:1) |
| `--danger` | `#E08570` | Para texto/icono; los toasts usan `--on-danger` |
| `--danger-hover` | `#EC9480` | |
| `--on-danger` | `#1C1A17` | 6.5:1 |
| `--border` | `#3A352E` | |
| `--border-control` | `#7C7468` | 3.2:1 sobre raised |
| `--focus` | `#F0844F` | |
| `--shadow-card` | `0 1px 2px rgba(0,0,0,.5), 0 4px 14px rgba(0,0,0,.35)` | |
| `--shadow-pop` | `0 12px 32px rgba(0,0,0,.55)` | |

Reglas de migracion (P0, sin cambio funcional):
- `bg-accent text-white` en botones → `bg-[var(--accent-strong)] text-[var(--on-accent)]`.
- `text-accent` en textos pequenos → `text-[var(--accent-ink)]`.
- `border-border` en inputs → `border-[var(--border-control)]`.
- `:focus-visible { outline: 3px solid var(--focus) }` → mantener 2px pero con `--focus` (el acento actual no llega a 3:1 sobre crema).
- Los toasts danger usan `text-[var(--on-danger)]`.
- `--accent` se queda para dots, subrayado activo, pills y decoracion grande.

### 6.2 Tipografia responsive

Sin webfonts nuevas (CSP `font-src 'self'`). Se mantiene la pila actual: display serif del sistema + Instrument Sans con fallback.

| Rol | Movil | `md` | `lg` | Peso / tracking |
|---|---|---|---|---|
| Display pagina (login, empty) | 28px | 32px | 36px | 600, -0.01em, lh 1.12 |
| Titulo de seccion (header) | 20px | 22px | 24px | 600, -0.01em |
| H2 de card | 18px | 20px | 20px | 600 |
| Titulo de card / item | 15px | 16px | 16px | 600 |
| Cuerpo | 15px | 16px | 16px | 400, lh 1.55 |
| Secundario | 13px | 13px | 13px | 400, lh 1.45 |
| Micro / overline | 11px | 11px | 11px | 600, uppercase, 0.06em |
| Metrica | 28px | 32px | 36px | 600, lh 1 |

- Maximo de lectura en prosa (nota): 68ch.
- No usar `text-white` fijo: siempre tokens.
- Numeros tabulares en metricas (`font-variant-numeric: tabular-nums`).

### 6.3 Espaciado, radios, sombras

| Token | Valor | Uso |
|---|---|---|
| space-1..10 | 4, 8, 12, 16, 20, 24, 32, 40 | Escala Tailwind por defecto |
| Gutter pagina | 16 / 24 / 32 | base / md / lg |
| Gap entre secciones | 20 / 24 | base / md |
| Padding de card | 16 movil, 20 escritorio (comoda), 14 (compacta) | |
| Gap de lista | 12 (comoda), 8 (compacta) | |
| Gap de grid | 8 / 12 / 16 | base / md / xl |

- Radios: 12px controles (`rounded-xl`), 16px cards (`rounded-card`), 24px sheets/hero/login (`rounded-blob`), full para chips y avatares.
- Sombras: solo `--shadow-card` y `--shadow-pop`. Nada de sombras duras ni multiples capas.
- Bordes: 1px hairline; controles con `--border-control`; seleccionado 1.5px `--accent-strong`.

Densidad (`data-densidad`):
- `comoda` (default): los valores de arriba.
- `compacta`: padding de card 14px, gap de lista 8px, gap de grid 8px, altura de filas de proyecto 64px.
- Afecta en P1 a: IdeaCard, LibCard, ProyectoCard, listas de Bandeja/Biblioteca/Foco y filas de tokens. P2: resto.

### 6.4 Interaccion: hover, active, focus

- Hover solo en `@media (hover: hover) and (pointer: fine)`; en tactil no hay estados pegados.
- Cards: `--shadow-card` → `--shadow-pop`, 150ms ease-out. Sin `translateY` (evita jank y mareo).
- Nav: fondo `--surface-raised`; activo siempre `--accent-soft`.
- Boton primario: `--accent-strong` → `--accent-hover`; nunca `opacity` (rompe contraste).
- Active: `scale(0.98)` solo con `motion-safe`; el boton de enviar conserva su feedback.
- Focus visible: outline 2px `--focus`, offset 2. En botones rellenos, outline `--text` con offset 2 para que no se funda con el relleno.
- `:focus-visible` nunca se elimina; no usar `outline: none` sin sustituto.

### 6.5 Dark mode y reduced motion

- Cambio de tema: instantaneo (sin transicion de color global) para evitar flashes y repaints largos.
- `color-scheme` en `:root` y `[data-theme="dark"]`.
- Script de arranque antes del paint: resuelve `claro|oscuro|sistema` y `comoda|compacta`; con "sistema" escucha `matchMedia('(prefers-color-scheme: dark)')`.
- Reduced motion: se mantiene el bloque actual y se extiende a disclosure de Ajustes y hover de elevacion (sin animacion; el estado cambia igual).
- No hay animaciones auto-iniciadas nuevas. Nada de parallax ni scroll-driven.

---

## 7. Componentes nuevos y modificados

| Componente | Tipo | Responsabilidad |
|---|---|---|
| `AppShell` | modificar | Layout dual, sidebar, header de seccion, skip link, dock de captura |
| `DesktopSidebar` | nuevo | Marca, nav de 4 secciones, footer con email y logout |
| `SectionHeader` | nuevo | Header de escritorio con titulo, subtitulo opcional y slot de acciones; version compacta movil |
| `NavIconos` | nuevo (extraido de BottomNav) | Iconos SVG compartidos Foco/Bandeja/Biblioteca/Ajustes |
| `BottomNav` | modificar | 4a tab, `md:hidden`, iconos compartidos |
| `CaptureBar` | modificar | Fila unica en escritorio, dock acotado; mismo contrato |
| `Bandeja` | modificar | Acciones de header en desktop, ancho 46rem, densidad |
| `InboxList` | modificar | Gaps por densidad, esqueletos con el mismo ancho |
| `IdeaCard` | modificar | Padding por densidad, targets desktop |
| `Biblioteca` | modificar | Toolbar en una fila, max 75rem |
| `BibliotecaGrid` | modificar | Grid 2/3/4, toolbar responsive, chips con wrap |
| `LibCard` | modificar | `min-w-0`, padding por densidad |
| `DetalleItem` | modificar | 2 columnas en `lg`, aside sticky, boton Explicar en aside |
| `ExplicarFAB` | modificar | `lg:hidden` |
| `Foco` | modificar | Grid principal + rail en `xl`, orden responsive |
| `MetricasFoco` | modificar | Tipografia/escala desktop |
| `ListaProyectos` / `ProyectoCard` | modificar | Grid `lg:grid-cols-2`, card desktop 72-80px |
| `ProyectoDetalle` | modificar | 2 columnas en `xl`, hero full width |
| `ProyectoHeader` | modificar | Hero con nombre display y accion |
| `ExtensionCard` | modificar | Enlaces a ZIP y a Ajustes; tokens siguen aqui |
| `Ajustes` | nuevo (page + orquestador) | Carga secciones, header, layout |
| `SeccionAjustes` | nuevo | Card con titulo, descripcion y chip de estado |
| `AjustesCuenta` | nuevo | Email, cambiar contrasena, logout confirmado |
| `AjustesApariencia` | nuevo | Tema y densidad |
| `AjustesExtension` | nuevo | ZIP, pasos, tokens (reusa hook y lista) |
| `AjustesApp` | nuevo | PWA, share-target, APK |
| `AjustesAI` | nuevo | Estado y explicacion |
| `AjustesDatos` | nuevo | Export JSON |
| `AjustesAcerca` | nuevo | Version y datos |
| `Segmented` | nuevo | Radiogroup accesible reutilizable (tema, densidad, tipo) |
| `InstalarPWA` | nuevo | Captura `beforeinstallprompt`, estados instalada/no instalable |
| `ConfirmInline` | nuevo | Confirmacion a 2 toques con timeout (logout, revocar) |
| `PreferenciasInit` | nuevo | Script pre-paint de tema/densidad, listener de sistema |
| `usePreferencias` | nuevo | Lee/escribe localStorage, expone tema y densidad |

Sin librerias nuevas. Iconos: SVG inline con `aria-hidden` y nombre accesible en el control.

---

## 8. Mapa de archivos a tocar

Modificar:
- `src/components/AppShell.tsx`
- `src/components/BottomNav.tsx`
- `src/components/CaptureBar.tsx`
- `src/components/Bandeja.tsx`, `src/components/InboxList.tsx`, `src/components/IdeaCard.tsx`
- `src/components/biblioteca/Biblioteca.tsx`, `BibliotecaGrid.tsx`, `LibCard.tsx`, `DetalleItem.tsx`
- `src/components/foco/Foco.tsx`, `MetricasFoco.tsx`, `ListaProyectos.tsx`, `ProyectoCard.tsx`, `ProyectoDetalle.tsx`, `ProyectoHeader.tsx`, `ExtensionCard.tsx`
- `src/components/ai/ExplicarFAB.tsx`
- `src/app/login/page.tsx`, `src/app/registro/page.tsx`
- `src/app/layout.tsx` (script pre-paint, `theme-color`, iconos Apple)
- `src/app/globals.css` (tokens claro/oscuro, focus, densidad, `color-scheme`)
- `tailwind.config.ts` (mapear solo tokens nuevos necesarios)
- `src/lib/types.ts` (`TabId` + `ajustes`)
- `public/manifest.webmanifest` (iconos 192/512/maskable)

Crear:
- `src/app/ajustes/page.tsx`
- `src/components/ajustes/*` (orquestador + 7 secciones + `SeccionAjustes`, `Segmented`, `InstalarPWA`, `ConfirmInline`)
- `src/components/DesktopSidebar.tsx`, `src/components/SectionHeader.tsx`, `src/components/NavIconos.tsx`
- `src/components/PreferenciasInit.tsx`, `src/lib/preferencias.ts`
- `public/downloads/mente-extension.zip`
- `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`
- `src/app/api/exportar/route.ts` (P1, requiere aprobacion)

No tocar:
- `src/proxy.ts` (`/ajustes` ya queda protegida).
- Contratos de `/api/ideas`, `/api/colecciones`, `/api/proyectos`, `/api/objetivos`, `/api/tareas`, `/api/captura/token`, `/compartir`.
- `src/app/compartir/route.ts`, `public/sw.js`.

---

## 9. Criterios de aceptacion

### 9.1 Responsive y layout

- [ ] A 360x800: `document.documentElement.scrollWidth <= window.innerWidth`; no hay scroll horizontal en Bandeja, Biblioteca, Foco, Ajustes, login, registro, detalle.
- [ ] A 360: bottom nav con 4 items, cada uno >=44px de alto y ancho; captura visible sobre la nav en Bandeja; header 48px.
- [ ] A 767: identico a movil (la columna sigue centrada en `max-w-md`).
- [ ] A 768: sidebar visible (240px), bottom nav **ausente del DOM visible y del arbol de accesibilidad**, header 56px, sin `max-w-md` en el shell.
- [ ] A 1024: sidebar 256px, contenido con gutter 32, Biblioteca en 3 columnas, proyectos Foco en 2 columnas.
- [ ] A 1280 y 1440: Biblioteca en 4 columnas; Foco con rail de 320px; ningun contenido supera su max-width ni queda pegado al borde.
- [ ] Sin `overflow-x: hidden` global: los desbordamientos estan corregidos en su componente.
- [ ] Ningun elemento `fixed` tapa contenido en ningun breakpoint (FAB oculto en `lg`; composer dentro del flujo).
- [ ] Zoom al 200% a 1280: no se pierde contenido ni aparece scroll horizontal.

### 9.2 Navegacion

- [ ] Se llega a Foco, Bandeja, Biblioteca y Ajustes desde sidebar (escritorio) y bottom nav (movil), con `aria-current="page"` en el activo.
- [ ] "Saltar al contenido" aparece con el primer Tab y mueve el foco a `#contenido`.
- [ ] El orden de tabulacion es: skip link → marca → nav → acciones del header → contenido → footer del sidebar.
- [ ] Volver (`←`) desde los detalles funciona y conserva el contexto de seccion.
- [ ] Logout funciona desde: header movil, footer del sidebar y Ajustes > Cuenta.

### 9.3 Pantallas

- [ ] Bandeja: lista <=736px, toggle de archivadas operativo, 3 esqueletos de loading, empty y error visibles.
- [ ] Biblioteca: 2/3/4 columnas exactas en 768/1024/1280; ninguna card baja de 200px de ancho; detalle a 2 columnas desde `lg`; sin FAB en `lg`.
- [ ] Foco: metricas legibles, proyectos en 2 columnas desde `lg`, rail solo desde `xl`, detalle a 2 columnas desde `xl`.
- [ ] Login/Registro: tarjeta de 416px maximo, centrada a 1440; no se estira; error inline y loading en boton.

### 9.4 Ajustes

- [ ] `/ajustes` sin sesion redirige a `/login` (proxy actual).
- [ ] Las 7 secciones existen en el orden definido y se alcanzan por scroll.
- [ ] Tema claro/oscuro/sistema se aplica al instante, persiste tras recargar y no produce flash blanco.
- [ ] Densidad comoda/compacta persiste y cambia padding de cards y gaps de lista.
- [ ] Descargar ZIP entrega `mente-extension.zip` y al descomprimir `manifest.json` esta en la raiz.
- [ ] Generar token muestra el valor una sola vez; copiar anuncia "Copiado"; revocar pide 2 toques y elimina de la lista.
- [ ] El boton de instalar PWA aparece solo si el navegador lo permite; si no, se ven los pasos.
- [ ] APK sin URL configurada muestra "En preparacion" y **ningun enlace roto**.
- [ ] Exportar descarga un JSON valido con las 6 colecciones de datos y requiere sesion.
- [ ] Cambiar contrasena: no se puede enviar si no coincide o si tiene <12; error y exito anunciados con roles.
- [ ] Logout pide confirmacion a 2 toques y caduca a los 4s.

### 9.5 Accesibilidad (AA)

- [ ] Texto normal >=4.5:1 y UI/foco >=3:1 en claro y oscuro (incluye botones primarios y bordes de input).
- [ ] El estado nunca se comunica solo con color: siempre hay texto o icono con nombre.
- [ ] Todo control tiene nombre accesible; iconos decorativos con `aria-hidden`.
- [ ] Focus visible en todos los interactivos, incluidos los rellenos.
- [ ] Radios de Apariencia operables con flechas y anunciados como grupo.
- [ ] `prefers-reduced-motion`: sin animaciones no esenciales (fade, shake, hover elevado).
- [ ] Contraste de `--text-soft` sobre `--surface` >=4.5 en ambos temas.
- [ ] Documento con `lang="es"` (ya esta) y un solo `h1` por pantalla.

### 9.6 Calidad

- [ ] `npm run build` y `npm run lint` pasan.
- [ ] Cero dependencias nuevas en `package.json`.
- [ ] Ningun cambio en los contratos de API existentes; `/api/exportar` es solo lectura y autenticada.
- [ ] Strings de UI sin tildes y sin `>` crudo en JSX.
- [ ] Sin `any` nuevos ni variables muertas.

---

## 10. Riesgos y decisiones abiertas

| # | Tema | Riesgo | Propuesta |
|---|---|---|---|
| 1 | APK | No hay proyecto Android; TWA/Capacitor exige pipeline y posible dependencia nueva | No prometer APK; PWA como ruta oficial. Decidir con David si se aborda como iniciativa aparte. |
| 2 | ZIP de extension | Si el ZIP se genera mal (carpeta contenedora), Chrome no lo carga | Verificar el contenido del ZIP en QA; pasos explicitos de descomprimir. |
| 3 | Cambio de contrasena | Supabase puede exigir reautenticacion segun configuracion | Mostrar error claro y sugerir cerrar sesion y volver a entrar si falla. |
| 4 | Export JSON | Es capacidad nueva (aunque pedida) | Aprobar endpoint de solo lectura antes de construirlo. |
| 5 | Contraste | Migrar `text-white` a tokens toca muchos botones y cambia el look del primario | Aplicar en el mismo paso que los tokens; revisar visualmente 6 pantallas. |
| 6 | Densidad | Refactor de paddings en muchas cards | P1 limitado a las cards listadas; resto P2. |
| 7 | Iconos PWA | Sin 192/512 Chrome no ofrece instalar | Generar PNG desde `icon.svg` y validar `manifest` antes de mostrar el boton. |
| 8 | Sidebar con 4 items | Ajustes en nav compite con secciones de contenido | Aceptado: es convencion (Krug); logout sigue accesible en header. |
| 9 | `max-w-md` movil | En telefonos grandes la columna queda estrecha | Consciente: conserva la esencia y la captura; se puede subir a 34rem si David lo pide. |

Preguntas para David (bloqueantes solo la 1):
1. APK: ¿lo dejamos como "en preparacion" con PWA recomendada, o quieres abrir una iniciativa TWA en la siguiente iteracion?
2. ¿Aceptas el primario en terracota mas profundo (`#C6541F`) para cumplir AA, o prefieres mantener `#E86A33` con texto oscuro (`#2B2822`, tambien AA)?
3. ¿La densidad compacta debe ser la opcion por defecto en escritorio?

---

## 11. Hints de motion (para motion-designer)

| Donde | Tipo | Mood / duracion |
|---|---|---|
| Cambio de tab / seccion | Sin animacion de pagina | El layout no debe desplazarse; solo estado activo |
| Sidebar item activo | Fade de fondo 150ms ease-out | Calmo, casi imperceptible |
| Cards (hover escritorio) | Sombra card → pop 150ms | Tactil, sin desplazamiento |
| Aparicion de idea capturada | `fade-rise` 200ms existente | Recompensa inmediata, ya definida |
| Disclosure de contrasena | Fade + 2px rise 160ms | Sobrio, sin altura animada |
| Cambio de tema | Instantaneo, sin cross-fade | Evitar flash y repaints |
| Confirmacion a 2 toques | Cambio de texto inmediato + timeout visual de 4s | Claridad, no juego |
| Loading de tokens/export | Shimmer existente o spinner discreto | Nunca bloquear la lectura |

Reglas: nada de scroll-driven, parallax ni auto-play. Todo bajo `motion-safe` y anulado en reduced motion.

---

## 12. Anexo: copy de UI (sin tildes)

| Contexto | Texto |
|---|---|
| Nav | `Foco`, `Bandeja`, `Biblioteca`, `Ajustes` |
| Ajustes subtitulo | `Tu cuenta, tu app, tus datos.` |
| Cuenta | `Correo`, `Sesion iniciada`, `Cambiar contrasena`, `Contrasena nueva`, `Repite la contrasena`, `Guardar contrasena`, `Minimo 12 caracteres.`, `Contrasena actualizada.`, `Cerrar sesion`, `Seguro? Toca de nuevo` |
| Apariencia | `Tema`, `Claro`, `Oscuro`, `Sistema`, `Densidad`, `Comoda`, `Compacta`, `Mas aire`, `Mas items a la vista`, `Tema oscuro activado.` |
| Extension | `Extension de Chrome v1.0.0`, `Instalacion manual`, `Descargar ZIP`, `Generar token`, `Copia este token ahora. No se vuelve a mostrar.`, `Copiar`, `Copiado`, `Revocar`, `Aun no hay tokens.` |
| Pasos extension | `Descarga el ZIP y descomprimelo en una carpeta.`, `Abre chrome://extensions en Chrome.`, `Activa "Modo de desarrollador" (arriba a la derecha).`, `Pulsa "Cargar desempaquetada" y elige la carpeta donde ves manifest.json.`, `Abre la extension, pega la URL de Mente y el token que generes abajo.` |
| App movil | `Instalar en este dispositivo`, `Ya esta instalada.`, `Instala Mente en tu telefono. Se abre como app y comparte capturas.`, `Comparte desde cualquier app y elige Mente.`, `APK para Android`, `En preparacion`, `La PWA hace lo mismo y se actualiza sola.` |
| AI | `AI`, `Operativa`, `No configurada`, `Nada se aplica sin tu toque.`, `La app funciona sin AI.`, `Tu contenido se envia al proveedor de AI solo cuando pides una sugerencia o una explicacion.` |
| Datos | `Exportar mis datos`, `Descarga todo lo tuyo en un archivo JSON.`, `Preparando...`, `Descarga iniciada.`, `No se pudo exportar. Reintenta.` |
| Acerca de | `Mente v0.1.0`, `Un sistema personal de captura y foco. Solo para ti.`, `Alojado en Supabase (us-east-1).` |
| Errores | `No se pudo descargar. Reintenta.`, `No se pudo guardar. Reintenta.`, `No se pudo completar la accion. Reintenta.` |

Convenciones:
- Sentence case, sin signos de exclamacion.
- Botones en infinitivo o imperativo corto (`Reintentar`, `Guardar`, `Copiar`), nunca "OK".
- Nunca prometer algo que no existe (APK, estado de AI, deteccion de extension instalada).
- Sin tildes en strings JSX; `>` como `→`.

---

## 13. Handoff a code-implementer (notas criticas)

1. **Empezar por el shell.** Quitar `max-w-md` del contenedor global es el 80% del fix; hazlo sin romper la columna movil (que conserva `max-w-md` por debajo de `md`).
2. **BottomNav debe desaparecer en `md`**, no solo ocultarse visualmente: usa `md:hidden` en el nav completo para que no quede en el arbol de accesibilidad.
3. **Un solo lugar para el logout en escritorio** (footer del sidebar) y dos en movil (header + Ajustes). No dupliques handlers: extrae una funcion compartida en el shell o un helper.
4. **`captureBar` sigue siendo prop de `AppShell`**; envuelvela en el dock responsive sin cambiar el contrato de `Bandeja`.
5. **Los tokens nuevos son la base**, no un extra: migra `text-white` sobre accent y bordes de input antes de QA visual, o los criterios AA fallan.
6. **`TabId`** debe incluir `ajustes`; revisa que `BottomNav` y `AppShell` no asuman 3 tabs.
7. **Ajustes no crea un layout nuevo**: usa `AppShell`. Nada de sidebars paralelas ni rutas anidadas.
8. **Extension: enlace real `<a download>`**. No generes el ZIP en runtime ni en una API route.
9. **APK: constante vacia = estado "En preparacion"**. Ningun `href` a un archivo inexistente.
10. **Preferencias antes del paint.** Si el script de tema se ejecuta despues del primer render, habra flash y David lo notara.
11. **No metas `overflow-x-hidden` global**; corrige `min-w-0`, `truncate` y grids con `minmax(0,1fr)`.
12. **QA manual minimo**: 360, 768, 1024, 1280, 1440 en las 6 rutas; teclado solo; tema oscuro; reduced motion; token y ZIP reales.
