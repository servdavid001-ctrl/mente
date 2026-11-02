# Spec UI — Módulo 3: AI organizadora + expansión semántica + explicar item

> Para ti, coder: esto EXTIENDE `modulo1-ui-spec.md` + `modulo2-ui-spec.md`. NADA de colores base nuevos; el sistema de dots/semáforo/sheets se queda igual. Prohibido código de implementación: tokens CSS y contratos de props solo (sección final). Regla irrenunciable del Foundation #4: **la AI sugiere, tú apruebas** — ninguna acción se aplica sin tap del usuario.

## 1. Extensiones del sistema de diseño para lo AI

- **Estado visual "sugerido" (chip diferenciado):** borde 1.5px **discontinuo** (`border-dashed`) en `--accent`, fondo `--surface`, dot de la colección propuesta (paleta de 8). Micro-estado nuevo (borde), no color nuevo: sugerida = borde punteado + dot; aprobada/aceptada = chip sólida de módulo 2 + semáforo ✓. Así se ve de un glance qué decidiste y qué es propuesta (Nielsen #1).
- **Dot fantasma:** si la colección propuesta es NUEVA (sin dot aún), el chip lleva un dot hueco con anillo punteado `--accent` + etiqueta `Nueva`.
- **Micro-estados AI (tokens, no colores nuevos):** `--ai-pending` = opacidad 0.7 del acento (procesando); el estado se comunica SIEMPRE con texto/aria-live, nunca solo por color (Nielsen #1, 1.4.1).
- **Animaciones mínimas (duras):** chip sugerida entra con fade+rise 200ms; "pensando…" = 3 puntos que aparecen secuencialmente cada 400ms en loop; todas se apagan con `prefers-reduced-motion: reduce` (queda texto estático "Pensando..."). Nada de orbes, gradientes animados ni confetti — la AI de Mente es calmada (Delight: la personalidad vive en el copy y el ✦, no en motion).
- **Íconos de entidades por tipo (svg 16px, lucide, `aria-hidden` + label textual):** autor → `pen-line`; libro → `book`; persona → `user`; lugar → `map-pin`; marca → `building-2`; concepto → `tag`. Todos en `--text-soft`, delante del nombre en 14px. El ícono nunca explica solo: el TEXTO es la fuente (a11y módulo 1).
- **Badge de la AI:** ✦ (sparkle) 14px `--accent` prefijo en toda salida de IA: "✦ Sugerido", "✦ Explicación". Es marca de fiabilidad (sistema vs. contenido propio), consistente en toda la app.

## 2. Flujo Bandeja — sugerencia de categoría

- Cuando una IdeaCard ✗ recibe sugerencia (la petición se disparó tras la captura; la respuesta llega por polling del módulo), el semáforo ✗ se convierte en el **chip sugerida** (§1) posicionado exactamente donde estaba el badge — misma coordenada, cero reflow (prevención de error de layout).
- El chip es `<button aria-label="Sugerencia de la AI: {nombreColeccion}">`; el tap abre CategorizarSheet **ya pre-enrutada** (§3).
- Debajo del chip (solo si aún no la tocaste): acción secundaria `No me sirve (✕)` 13px `--text-soft`, área total ≥44px — rechaza la sugerencia y el item vuelve al estado ✗ simple (control y libertad, Nielsen #3).
- La card categorizada con ✓ sigue igual a módulo 2; las mini-chips de colección debajo de la meta son el estado final. Sugerido → aprobado se lee en la MISMA card sin saltos (Krug <5s).
- **Regla:** máximo 1 sugerencia visible por card — no apilamos chips (aire Notion).

## 3. CategorizarSheet con sugerencia pre-enrutada

- Mismo sheet de módulo 2 ("¿Dónde vive esta idea?") con 2 diferencias:
  1. La colección propuesta **ya llega seleccionada** (chip activa). Si es colección nueva, entra por el flujo inline de módulo 2 §5 con el nombre precargado.
  2. Encima del bloque Colecciones, banner de 1 línea: `✦ Sugerido por tu AI` con dot de color + nombre; botón `✕ Descartar sugerencia` (44px) que **descarta esta sugerencia para siempre** para este item (confirmación inline de acción irreversible — regla módulo 1 §7) y deselecciona la chip.
- El usuario puede deseleccionar la sugerida y añadir otras: la sugerencia es SOLO un default (Fogg: reduce el esfuerzo al mínimo; el usuario conserva el control — Nielsen #3).
- Botón primario sigue `Listo`. Guardado = flujo estándar módulo 2: ✓, mini-chips, sin toast.
- El banner lleva `role="status"` con aria "Sugerencia de la AI: {nombreColeccion}".

## 4. Expansión semántica en el item (ItemDetail)

- **Dónde vive:** ItemDetail (`/biblioteca/[id]`), NO inline en la card — ahí hay varias capas (transcripción + entidades + conexiones) y la card debe seguir visual-first.
- **Cuándo se lanza:** **automático y discreto al abrir** para items de tipo Link (video/artículo/reel): sección "Expansión ✦" aparece plegada mientras procesa; si no molesta, colapso con `✕`. Para Texto/Voz es **bajo demanda** con botón "Ampliar con la AI ✦" — la transcripción de audio es la acción con más costo: botón explícito, no disparo automático (fricción intencional justificada).

### 4.1 Transcripción
- Artículo: el texto extraído se muestra directo como cita en bloque + "✦ Sacado del artículo"; botón secundario "Añadir a mi nota" lo inserta en el NotaEditor.
- Video/audio: `TranscripcionPanel` plegado: tap "Ampliar con la AI ✦" → estado pensando (§1) → texto transcrito. "Añadir a mi nota" igual.

### 4.2 Entidades
- Bloque "Entidades detectadas" con `EntidadesTags`: tags-chip con icono del tipo + `aria-label="{Tipo}: {nombre}"`, scroll-x. Solo informativas (span, no tappable — no mentir con rol). Si no hay: "No detectamos entidades." 13px, sin drama.

### 4.3 Conexiones propuestas
- Bloque `ConexionesPropuestas`: lista de cards mini; cada una = **item existente** de tu biblioteca (icono de tipo + título 15px semibold) + frase de por qué sugiere (`--text-soft` 13px: "Comparten autor: X", "Mismo tema: ritmo") + acciones: `Aceptar` (pill h-8 estilo módulo 1, en `--accent`) / `Descartar` (ghost ≥44px).
- **Aceptar = POST real a /api/conexiones**, con feedback táctil suave; la card pasa a estado aceptado (borde `--success` sólido + etiqueta "✓ Conectada") y se promociona al ConexionesPanel (módulo 2), desaparece de la lista de propuestas.
- **Descartar** la quita de la lista; no hay bloqueo permanente — puede reaparecer cuando la biblioteca crece. Duplicada: fila deshabilitada + "Ya están conectadas." (módulo 2 §4).
- Cero propuestas → la sección NO se renderiza (nunca sensación de "=0" vacía que grite error).

## 5. Explicar item — panel chat mínimo (`ExplicarPanel`)

- **Entra por:** botón flotante ✦ en ItemDetail: 56px círculo `--accent`, `aria-label="Explicar este item con la AI"`, sombra `--shadow-pop`, esquina inferior derecha (no tapa el hero ni los datos).
- Panel: bottom-sheet de módulo 1 (radius 24, `--surface-raised`), chat mínimo:
  - **Primera respuesta automática:** la AI responde tres marcos: qué es, por qué funciona, cómo se conecta con tu biblioteca — 3 párrafos cortos, sin listas, con tono lectura idle. Loading = animación §1 con aria-live "Pensando...".
  - **Seguimiento:** input al pie "Pregúntale algo sobre esto..." (textarea auto-grow; Enter envía en desktop, no en móvil). Cada respuesta se adosa al hilo; solo los últimos 5 turnos quedan a la vista, previa colapsable con "Ver anteriores" (mantiene el chat corto — Don't Make Me Think).
  - **Cerrar:** ✕ 44px arriba derecha; ESC + tap fuera; **el hilo NO se pierde al cerrar** (reabres y continúa para ese item — inversión del usuario, Core Loop §5).
  - Título del panel: serif "✦ Sobre esta idea".
- Chat mínimo: sin emoji, solo párrafos y negrita (mismos límites del NotaEditor módulo 2).

## 6. Contenido → tareas (previsualización + minuta)

- Si la expansión detecta pasos accionables, bajo ConexionesPropuestas: sección "Esto puede convertirse en tareas ✦" con botón `Convertir ✦`.
- **La lista de tareas llega en módulo 7** — por eso en módulo 3 la acción aceptada produce `AccionMinuta`: card de confirmación `✓ Guardada como minuta para cuando llegue tu lista de tareas` + pill `Minuta` bajo la meta del ItemDetail. Prometemos exactamente lo que hay (Nielsen #2: sin mentiras sobre el futuro).

## 7. Estados (sin sugerencias, primer uso, errores, rate/latencia)

| Dónde | Estado | Tratamiento (nunca spinner centrado; comunicar estructura) |
|---|---|---|
| Bandeja, item ✗ sin sugerencia | "pedir sugerencia" | Botón secundario `Pedir sugerencia ✦` bajo la meta (tap ≥44px). Solo en items ✗. |
| Bandeja, primera vez que la AI actúa | primer uso | Una sola vez, banner inline sobre la lista: `✦ Antes de asombrarte, tu AI lee tu biblioteca. Nada se aplica sin tu toque.` Cierra con ✕. |
| Bandeja, biblioteca sin items | "mano vacía" | La AI no puede proponer conexiones sin biblioteca: línea final `✕ No hay sugerencias hoy: tu biblioteca crecerá y volveremos.` Sin bloqueo. |
| Cualquier acción AI | latencia (~1–10s) | Skeleton de la estructura + "Pensando..." aria-live. El input/área no se limpia durante la carga (Krug: nada queda "en el aire"). |
| Cualquier acción AI | error de red | Banner inline: `No se pudo procesar. Reintentar`. **Nunca se pierde trabajo del usuario** (nota, texto o prompt persisten). Reintentar retoma donde estaba, no reinicia. |
| Cualquier acción AI | rate limit / límite diario | `Has usado tu análisis de hoy. Vuelve mañana — tus ideas siguen intactas.` Acción deshabilitada. |
| ExplicarPanel | AI no responde | Mensaje en panel: `Tu AI no respondió. Reintentar` — hilo intacto, input usable. |
| Link sin contenido extraible | — | "No encontramos contenido en este link." línea suave, sin error rojo. |

## 8. Accesibilidad WCAG AA adicional (solo lo NUEVO; base módulos 1–2)

- Chip "sugerido": el borde punteado es decorativo; la info vive en el texto accesible ("Sugerencia de la AI: {nombre}").
- Todos los controles AI (Aceptar/Descartar/Pedir/Convertir/Reintentar/descartar-para-siempre/FAB) ≥44×44 con focus ring 2px `--accent` offset 2, `focus-visible`.
- `aria-live="polite"` en: banner de nueva sugerencia, contador de propuestas ("2 sugerencias"), estado "Pensando", respuesta del ExplicarPanel (`role="log"`).
- Entidades: `<span>` con `aria-label="{Tipo}: {nombre}"` — información, no acción.
- ExplicarPanel como `dialog aria-modal`: foco al input al abrir, ESC + tap fuera cierran, focus devuelto al FAB.
- `prefers-reduced-motion`: apagar puntos secuenciales (texto estático), fade+rise → fade 0ms.
- Texto sobre `--accent-soft` mantiene ratio módulo 2 ≥7:1; ✦ decorativo lleva `aria-hidden` y su significado está en el texto del botón.

## 9. Componentes con props tipados (contrato para code-implementer — el archivo TERMINA aquí)

```tsx
ChipSugerencia
  // Chip diferenciada en la card (reemplaza el slot ✗ del módulo 1): border-dashed accent + dot, tap 44px
  { sugerencia: { coleccionId: string; nombreColeccion: string; esNueva: boolean; dotColor?: DotColor };
    onOpenSheet: (ideaId: string) => void; onDescartar: (ideaId: string) => void }

SugerenciaSection
  // Banner dentro de CategorizarSheet: 'Sugerido por tu AI' + descartar para siempre (irreversible)
  { sugerencia: { nombreColeccion: string; esNueva: boolean; dotColor?: DotColor };
    onDescartarParaSiempre: () => Promise<void>; isLoading: boolean }

TranscripcionPanel
  // Cita de articulo / transcripción de video-audio dentro de ItemDetail; añadirla al NotaEditor
  { estado: 'idle' | 'loading' | 'listo' | 'error' | 'rate'; texto?: string; origen: 'articulo' | 'video' }
  { onAnalizar: () => void; onReintentar: () => void; onAniadirANota: (texto: string) => void }

EntidadesTags
  // Tags informativos con icono por tipo (span, no button); scroll-x; vacío = mensaje suave
  { entidades: Array<{ id: string; nombre: string; tipo: 'autor'|'libro'|'persona'|'lugar'|'marca'|'concepto' }> }

ConexionesPropuestas
  // Lista de propuestas item+motivo; Aceptar = POST real -> promo a ConexionesPanel; duplicada deshabilitada
  { propuestas: Array<{ id: string; haciaId: string; tituloItem: string; tipo: string; motivo: string; duplicada: boolean }> }
  { onAceptar: (haciaId: string) => Promise<void>; onDescartar: (id: string) => void }

ExplicarPanel
  // Sheet chat mínimo sobre esta idea: primer marco de 3 párrafos + seguimiento; hilo persiste al cerrar
  { item: { id: string; titulo: string }; hilo: Array<{ de: 'ai' | 'yo'; texto: string }>;
    estado: 'cerrado' | 'pensando' | 'listo' | 'error' | 'rate' }
  { onPreguntar: (texto: string) => void; onReintentar: () => void; onCerrar: () => void }

AccionMinuta
  // Confirmación contenido->tareas (módulo 3 guarda deuda documentada para módulo 7)
  { tituloItem: string }

ExplicarFAB
  // Botón flotante ✦ en ItemDetail (56px, sobre la esquina inferior derecha)
  { onClick: () => void; ariaLabel: string }

BotonPedirSugerencia
  // Bandeja: pedir sugerencia manual para un item ✗ sin propuesta
  { onPedir: (ideaId: string) => void; estado: 'quieto' | 'loading' | 'error' | 'rate' }
```

---
**Handoff a code-implementer:** DotColor y chips de módulo 2 no cambian; endpoints reales con auth en cada route (`401` si !user, AGENTS.md) — el ÚNICO side-effect inmediato es el POST de conexión y el guardado de minuta; descartar-para-siempre es PUT al item (nunca DELETE); errores `catch (error: unknown)`; copy sin tildes prohibido no aplica aquí: el copy vive tal cual en la tablita §7-§8 y en cada componente; nada de música/animación de más — si dudas entre un efecto y el texto estático, gana el texto.
