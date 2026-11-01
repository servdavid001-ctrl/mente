# Spec UI — Módulo 1: Fundamento (Foco/Bandeja/Biblioteca + Bandeja funcional + login)

> Para ti, coder: construye el esqueleto de 3 apartados, la Bandeja funcional y el login. En este módulo Foco y Biblioteca son placeholders vacíos con mensaje de "llegará pronto". Nadie pregunta "¿qué quieres lograr?" — eso viene en módulo 4.

## 1. Design tokens (CSS values)

Ponerlos en `app/globals.css` como variables; Tailwind las mapea en `tailwind.config.ts`.

```css
:root {
  --bg: #F5F1E8;          /* crema cálido, no blanco puro (referencia albo.inc) */
  --surface: #FDFBF6;     /* card, un paso más claro que el fondo */
  --surface-raised: #FFFFFF; /* solo para overlays/modales */
  --text: #2B2822;        /* marrón-negro cálido */
  --text-soft: #6B665C;   /* secundario, placeholder */
  --accent: #E86A33;      /* naranja terracota cálido — Verrollamos abajo */
  --accent-soft: #FBEEE6; /* fondo pill/estado activo */
  --danger: #B3573F;      /* archivar/eliminar, rojo cálido no agresivo */
  --border: #E4DECF;      /* hairline sobre crema */
}
```

- **Acento justificado (1 línea):** elijo naranja terracota `#E86A33` — Notion usa UN acento cáldo decorativo ("•Create" pill), Albo es cálido en fondo; el terracota se siente "idea encendida" y contrasta alto sobre crema (ratio 3.9:1 sobre `--bg`, AA para elementos grandes/estados, lo usamos solo en botones grandes, badges y siluetas — nunca como texto pequeño gris).
- **Stack tipográfico — DECIDIDO: display serif + sans humanista** (dos familias, como albo.inc):
  - Display/títulos/branding: `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif` (serif clásico con carácter; enchufable por "Instrument Serif" vía Google Fonts si quieres webfont).
  - UI/texto/cards/nav: `"Instrument Sans", "Inter", system-ui, -apple-system, sans-serif`.
  - Justificación: Notion es sans-only y se queda genérico; Albo demostró con evidencia REA que la serif display sobre crema es lo que da identidad. El riesgo de dos fuentes es manejable si la serif se acota a títulos + logo + pantallas de login/empty.
- **Radios:** base `16px` (cards, inputs, botones), gran `24px` (cards hero, sheets, stickers/pill). Tailwind: extend `borderRadius: { card: '16px', blob: '24px' }`.
- **Sombras mínimas** (Albo es flat suave; Notion casi sin sombra — ganamos menos es depth y más aire):
  - `--shadow-card: 0 1px 2px rgba(43,40,34,0.04), 0 4px 12px rgba(43,40,34,0.05);`
  - `--shadow-pop: 0 8px 24px rgba(43,40,34,0.10);` (solo para sheets/modales)
- **Spacing scale (Tailwind mapping):** mantener la escala por defecto (`4 = 1rem`); orden importa: paddings de pantalla `px-4/py-5`, gap entre cards `space-y-3`, gap dentro de card `gap-2`. El aire generoso (mucho whitespace) es Notion — respétalo.
- **Pill/sticker decorativo (Notion style):** altura fija `h-8 (32px)`, padding-x `px-3`, radio `24px` (blob), fuente sans 13–14px semibold, fondo `--accent-soft` con texto `--text` o fondo `--accent` con blanco. Solo en: logo, badges del semáforo y estados vacíos. Máximo 1 por pantalla — es especia, no salsa.

## 2. Layout mobile-first (PWA)

Un solo shell. Mobile es el caso principal (la captura pasa en el móvil). Desktop = la misma columna centrada `max-w-md` — no hagas layout dual en este módulo.

```
+---------------------------+
| (safe-area)               |
| Header (fino, 48px)       |  <- logo "Mente" serif + pill contextual
| contenido scrollable      |  <- pb estrategico para que CaptureBar no tape
| (tab dependiente)         |
|                           |
+---------------------------+
| CaptureBar (solo en       |  <- estilo WhatsApp: siempre visible abajo
|  la tab Bandeja)          |
+---------------------------+
| BottomNav (3 tabs, 64px)  |  <- fijo, safe-area inset bottom
+---------------------------+
```

### BottomNav
- 3 botones: `Foco` (icono target), `Bandeja` (icono inbox), `Biblioteca` (icono layers/book).
- Tab activo: icono y label en `--text` + un puntito/delineado en `--accent`; inactivo: `--text-soft`. La tab por defecto al abrir: **Bandeja** (es donde va todo lo nuevo, cero-clic para ver lo capturado — Fogg: ability máxima).
- Altura 64px + `env(safe-area-inset-bottom)`.
- Los botones Foco y Biblioteca navegan a sus placeholders del módulo.

### CaptureBar (estilo WhatsApp)
- Composer fijo abajo en la tab Bandeja (sticky, sobre el BottomNav, hasta 64px de alto): input de texto (placeholder "Escribe tu idea..."), botón mic, botón link, botón enviar (icono flecha o check, círculo de 44px, `--accent`).
- Comportamiento input: al empezar a escribir, el botón de link se oculta y el de mic se oculta; solo enviar. WhatsApp-consistency (convención antes que innovación — Krug).
- Mic: al pulsar cambia el input por un indicador "Escuchando..." con ondas sutiles; libera con el mismo botón o "Enviar". (La transcripción real es backend — tu solo renderiza el estado "grabando"clear y el resultado en el input editable para corregir antes de enviar — nunca envía sin que el usuario vea el texto final. Prevent-error de Nielsen.)
- Link: al pegar URL, preview ligera (favicon+domain, 1 línea) + queda listo para enviar. Si el texto pegado NO empieza con `http(s)://`, el botón no debe verse activo.
- **Regla de oro capture-cero-fricción (<5s, Foundation punto 1):** una idea nueva = escribir + tap enviar. Sin modales, sin campos extra, sin confirmaciones. La auto-guardado silencioso: al enviar, la card aparece INMEDIATAMENTE arriba de la lista en estado "optmista" con feedback táctil/haptic suave.

### Bandeja listado
- Lista vertical de `IdeaCard`s (path gap: `space-y-3`). Cada card: `--surface`, radius 16, sombra card, padding 16.
- Cards visual-first: **primera línea del contenido en 16px semibold**, tipo/meta en 13px `--text-soft`, timestamp relativo ("hace 2 min").
- Más reciente arriba. Sin filtros, sin búsqueda en módulo 1 — la bandeja corta no la necesita y cada control roba aire.

## 3. Estados de UI

| Pantalla | empty | loading | error | éxito |
|---|---|---|---|---|
| Bandeja | `EmptyState` ver abajo | skeleton de 3 cards (no spinner centrado — skeleton comunica estructura) | banner inline arriba de la lista: "No se pudo cargar tu bandeja. Reintentar" + botón | - |
| Envío idea | - | enviar deshabilitado + sutil spinner en el botón (no bloquear clic caótico) | toast "No se pudo guardar. Tu texto sigue en el composer — reintenta" (el texto NUNCA se pierde: es la regla de honor de esta barra) | nada especial: la card aparece. La ausencia de ruido ES el éxito (Delight nivel funcional-fiable) |
| Foco (placeholder) | "Tu Foco llega pronto." | - | - | - |
| Biblioteca (placeholder) | "Tu Biblioteca llega pronto." | - | - | - |
| Login | - spinner en botón | mensaje de error inline bajo el campo + shake sutil del campo | redirección al shell | redirección al shell |

### EmptyState de Bandeja (primera vez — copy motivador)
- Ilustración: 1 sticker decorativo tipo Notion: pill h-8 blob con `✨` + texto serif display grande:
  **"Tu cerebro descanza tranquilo."**
  Debajo, sans 15px `--text-soft`: **"Anota lo que primero se te pase por la cabeza — aquí lo atajamos antes de que se te escape."**
- Y un ancla visual: flecha/pulse sutil apuntando al CaptureBar (el trigger relacional: la acción requerida está a 1 distancia del mensaje).

### Semáforo de categorización (por item)
- Badge en cada card: derecha-arriba o junto al timestamp → `✗ sin categoría` (módulo 1: SIEMPRE ✗). Visual: circulito con ✗ blanco sobre `--text-soft`, tamaño 18px, `aria-label` exacto del estado. No uses rojo — el semáforo aquí no es "error", es "pendiente tuyo" (match al mundo real, Nielsen #2: es un TDL, no un defecto).
- En módulo 3 el ✗ se convierte en sugerencia de AI y el ✓ en categorizado. Diseña el badge como slot intercambiable, no hardcodeen el ✗ en la card.

### Acciones del item
- Opción A (swipe): deslizar a la izquierda revela `Archivar` (naranja suave) y `Eliminar` (peligro rojo). Deslizar a la derecha = nada (módulo 1 no tiene categoría rápida — no sobre-ofertas accesos).
- Opción B (equivalente accesible, obligatoria): long-press o tap en "⋯" (3-dots, 44px touch target) → sheet bottom con las 2 acciones en botones grandes full-width.
- Toda eliminación pide confirmación inline en la propia sheet (fricción intencional — ver §7). Archivar es reversible y no pide confirmación.

## 4. Accesibilidad WCAG AA (ratios verificados de mis tokens)

- **Contraste texto (fondo crema #F5F1E8):**
  - `--text #2B2822` sobre `--bg`: **~12.8:1** ✓ AAA.
  - `--text-soft #6B665C` sobre `--bg #F5F1E8`: **~4.6:1** ✓ AA normal. (No lo dejes caer a `#8B8478` — caería bajo 4.5.)
  - `--text` sobre `--surface #FDFBF6`: ~13:1 ✓·**`--text-soft` sobre `--surface`**: ~4.9:1 ✓.
  - Blanco sobre `--accent #E86A33`: **~3.4:1** — pasa AA solo para texto ≥18.66px bold o ≥24px o elementos gráficos/botones grandes. REGLA: texto blanco sobre acento siempre con font sans semibold ≥14px (es la excepción justificada por el botón enviar; si quieres cero excepciones, usa texto `--text` sobre `--accent-soft`).
- **Touch targets:** TODOS los interactivos ≥44×44px: botones de CaptureBar 48px, tabs de nav (área tocable completa), 3-dots de card. Padding no clave no cuenta — el área clicable mide.
- **ARIA:**
  - Icons svg **siempre** `aria-label` (AGENTS.md lo prohíbe con `title` no-`aria`): "Botón de enviar", "Botón de mic", "Botón para pegar un link", "Opciones de esta idea", etc.
  - Iconos puramente decorativos → `aria-hidden="true"`.
  - `BottomNav` = `<nav aria-label="Secciones">` con `aria-current="page"` en tab activa.
  - `CaptureBar` = `<form aria-label="Capturar una idea">`; mic grabando: `aria-live="polite"` para anunciar "Escuchando" y resultado.
  - Badge del semáforo: role=`img` + `aria-label="Sin categorizar"`; nunca el solo símbolo ✗.
  - Sheet de acciones: `role="dialog" aria-modal="true"`, cierre con ESC + tap fuera, focus trapeado y devuelto al disparador.
- **Focus states:** anillo 2px `--accent` con offset 2px visible en TODOS los interactivos (`focus-visible`, jamás `outline-none` a secas).
- **Motion:** toda animación respeta `prefers-reduced-motion: reduce` (desactivar skeleton shimmer, pulse de la flecha del EmptyState, shake del login).

## 5. Componentes + props tipados (contrato para code-implementer)

```tsx
AppShell
  // Layout raiz: header + contenido scroll + CaptureBar condicional + BottomNav
  { children: ReactNode; activeTab: 'foco' | 'bandeja' | 'biblioteca' }

BottomNav
  // Nav inferior de 3 tabs; aria-current en la activa
  { active: 'foco' | 'bandeja' | 'biblioteca'; onChange: (tab: TabId) => void }

CaptureBar
  // Composer estilo WhatsApp: texto + mic + link + enviar; gestiona sus estados grabando/preview
  { onSend: (idea: { text: string; sourceUrl?: string; kind: 'texto' | 'voz' | 'link' }) => Promise<void> }
  // onSend optimista: el caller actualiza la lista; CaptureBar solo limpia su input tras resolve OK

IdeaCard
  // Card visual-first de la Bandeja; manual del semáforo ✗ y acciones ⋯
  {
    idea: { id: string; text: string; sourceUrl?: string; createdAt: string; categorized: false }
    onArchive: (id: string) => void; onDelete: (id: string) => void
  }

InboxList
  // Lista de IdeaCards: orquesta empty/loading/error/swipe
  {
    ideas: Idea[]; isLoading: boolean; error?: string; onRetry?: () => void;
    onArchive: (id: string) => void; onDelete: (id: string) => void
  }
  // isLoading && ideas.length===0 → skeletons; ideas.length===0 → EmptyState; error → banner retry

EmptyState
  // Ilustración sticker + copy motivador + ancla al CaptureBar (solo primera vez / bandeja vacía)
  { title: string; description: string; icon?: 'sparkle' | 'target' | 'layers' }

LoginPage
  // Auth email+contraseña, errors inline, botón loading; al exito → rutea a shell en tab Bandeja
  { onSuccess: () => void }
```

Notas de props para ti: `categorized: false` es const en módulo 1 (el semáforo es siempre ✗) — tiparlo como literal para que módulo 3 no rompa el contrato al agregar más. Estado de sesión lo maneja el route layout, no LoginPage (LoginPage solo onSuccess).

## 6. Copy (tono: directo, humano, segunda persona) — pégalo tal cual

| Dónde | Texto |
|---|---|
| Header logo | `Mente` (serif, lowercase; es branding, module 1 no defina nombre — este es provisional igual que el repo) |
| CaptureBar placeholder | `Escribe tu idea...` |
| CaptureBar grabando | `Escuchando...` |
| Link preview label | `Link pegado` |
| Enviar (aria) | `Guardar idea` |
| Nav | `Foco` · `Bandeja` · `Biblioteca` |
| Bandeja empty título (serif display) | `Tu cerebro descanza tranquilo.` |
| Bandeja empty sub | `Anota lo que primero se te pase por la cabeza — aquí lo atajamos antes de que se te escape.` |
| Bandeja error | `No se pudieron cargar tus ideas. Reintenta` |
| Envío error toast | `No se pudo guardar. Tu idea sigue aquí, solo reintenta.` |
| Badge sin categorizar (aria) | `Sin categorizar` |
| Sheet título | `¿Qué hacemos con esta idea?` |
| Sheet: archivar | `Archivar` · sheet: eliminar | `Eliminar para siempre` |
| Confirmar eliminar (aria/copy) | `Botón de eliminar` → texto `Eliminar` (la gravedad la pone el estilo danger, no el copy largo) |
| Foco placeholder | `Tu Foco llega pronto. Aquí vivirán tus proyectos.` |
| Biblioteca placeholder | `Tu Biblioteca llega pronto. Aquí guardarás arte, ideas y referencias.` |
| Login título (serif) | `Bienvenido a Mente` |
| Login sub | `Tu espacio mental privado. Solo para ti.` |
| Login campo email | `Correo` · Login campo contraseña | `Contraseña` |
| Login botón | `Entrar` |
| Login error contraseña | `Contraseña incorrecta` · genérico | `No pudimos entrar. Revisa tus datos.` |

Regla de copy: sin jerga, sin "categorizar/deep-work/capture": 'bandeja', 'idea', 'guardar'. (Match al mundo real — Nielsen #2.)

## 7. Fricción intencional y microinteracciones

- **Confirmar eliminar:** única fricción añadida (acción irreversible). Inline en la sheet, no modal suelto. Archivar NO pregunta (reversible).
- **Texto del composer nunca se destruye por error de red** — el toast lo garantiza y el botón reintenta sin reescribir.
- **Micro-delight (nivel Pleasurable, barato y cero fricción):**
  - Card nueva: entra con un sutil fade+rise 200ms y una vibración háptica corta en móvil (via `navigator.vibrate(10)` — ok en PWA).
  - Send button: micro-scale 0.92→1 en tap down/up (feedback inmediato, Krug).
  - Semáforo ✗: al tap, tooltip copy "Aún sin categoría — la organizadora llegará pronto" (gestioná expectativas, no culpes al usuario).
  - No más: nada de confetti, nada de animación por animar (Delight jerárquico: Functional > Reliable > Usable > Pleasurable).
