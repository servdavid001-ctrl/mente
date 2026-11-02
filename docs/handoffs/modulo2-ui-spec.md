# Spec UI — Módulo 2: Biblioteca creativa

> Para ti, coder: esto EXTIENDE el sistema de `modulo1-ui-spec.md`, no lo reinventa. Misma columna `max-w-md`, mismos tokens base, mismo header y BottomNav. Prohibido código de implementación JS/TS: solo tokens CSS y contratos de props (sección final).

## 1. Extensiones del sistema de diseño (tokens NUEVOS; los base del módulo 1 no cambian)

- **Dots de colecciones (color nuevo, cerrado):** una colección lleva opcionalmente un color-identificador. Los 8 dots son paleta fija — el usuario ELIGE de la lista, no mete color libre (así nunca aparece un dot que no contrasta sobre crema):

```css
:root {
  --dot-terracota: #E86A33; /* puede "ser la naranja" — reutiliza el acento */
  --dot-mostaza: #A87B1F;  --dot-oliva: #6B7F45;   --dot-petroleo: #2F6F5E;
  --dot-tinta: #3D5A80;    --dot-violeta: #7B5C8E; --dot-rosa: #C25E7E;
  --dot-marron: #8B5E3C;   /* los 8: >=3:1 sobre --bg como elemento UI; nunca de fondo bajo texto chico */
  --success: #3F7A52;      /* ÚNICO color semántico nuevo: badge ✓ (blanco encima 5:1 AA) */
}
```

- **Chip de colección activa (estado nuevo, colores existentes):** inactiva = `--surface` + borde `--border` + dot del color; activa = fondo `--accent-soft` + borde 1.5px `--accent`. El estado se VÉ, no se adivina (Nielsen #4).
- **Grid bento (regla de layout nueva, no color):** la Biblioteca usa grid de 2 columnas con `gap 8px` — más denso que la lista `space-y-3` de la Bandeja; estética albo visual-first. Cards mantienen radius 16, `--surface`, `--shadow-card`.
- **Sheet largo (regla nueva):** mismo `--shadow-pop` + radius 24 de módulo 1; interior `max-h-[80dvh]` con scroll, header pegado.
- **Nota editable — límites (Foundation §límites):** solo párrafos, **negrita** y listas con viñeta. Prohibidos headers, código inline, colores de texto. El estilismo mínimo vive en `--text` (cuerpo/negrita) y `--text-soft` (viñetas).

## 2. Layout de la pestaña Biblioteca (reemplaza el placeholder)

```
+--------------------------------+
| Header 48px: "Biblioteca"      |  <- serif, mismo header del módulo 1
| Buscar  h-44 (lupa)            |  <- placeholder "Buscar en tu biblioteca..."
| Chips colecciones (scroll-x)   |  <- "Todas" | "Sin colección" | [dots+nombres]
| Filtro tipo (segmented h-44)   |  <- Todo · Texto · Voz · Link · Arte
| Toggle archivadas (texto sutil)|  <- derecha, aria 44px
| Grid 2 col de LibCard (gap 8)  |
+--------------------------------+
```

- **Chips de colecciones = multi-select:** "Todas" es el default (cero activos); tocar cualquier chip la activa y desactiva "Todas"; varias chips activas = ver items que tengan CUALQUIERA de ellas (OR humanamente esperable — Krug). "Sin colección" es chip especial: su dot es un círculo de borde hueco (`--border`), cumple la higiene.
- **Filtro de tipo = single-select:** Todo (default) · Texto · Voz · Link · Arte. Se combina con lo que digan los chips (AND).
- **LibCard visual-first (albo):** arte con imagen → la imagen cubre la mitad superior (`object-cover`, ratio 1:1, radius superior 16); texto/voz → bloque frontal con icono del tipo sobre `--accent-soft`. Debajo: 1 línea de título 14px semibold (`--text`; truncada), fila meta 12px `--text-soft` (tipo + fecha relativa), fila de colecciones: dots + nombres máx 2 + "+n". Voz muestra igualmente duración si existe.
- **Tap card** → abre ItemDetail.

## 3. Flujo Categorizar (desde la Bandeja)

- **Trigger:** el badge ✗ de la IdeaCard se vuelve TAPPEABLE (área total 44px; en módulo 1 ya es slot intercambiable) → abre la sheet. Equivalente accesible: opción "Categorizar" dentro del sheet de "⋯" (segunda entrada, mismo destino).
- **CategorizarSheet** (bottom-sheet, `--surface-raised`): título **"¿Dónde vive esta idea?"** + preview de 1 línea del texto. Bloques:
  1. **Destino:** única opción seleccionable en v1: "Biblioteca creativa" (row con check). Debajo, row gris no-tocable "A un proyecto — viene pronto" (gestionar expectativa; no miente con botón muerto).
  2. **Colecciones:** chips multi + fila inline "Nueva colección" (ver §5).
  3. Botón primario full-width **"Listo"** (`--accent`, h-48): guarda y cierra. Cargar: spinner en el botón, fondo de sheet congelado.
- **Resultado (semáforo):** badge pasa a **✓ blanco sobre `--success`** (tamaño del módulo 1, aria "Categorizada") y las colecciones elegidas aparecen como mini-chips debajo de la meta en la card. Animación 200ms del badge, fade-in de chips. Sin toast: el estado en la card ES el éxito (consistencia módulo 1).
- **Reversible siempre:** tap al ✓ en una card ya categorizada reabre la sheet para cambiar colecciones; opción secundaria danger "Quitar de Biblioteca" pide confirmación inline (devuelve a sin categoría — fricción intencional, mismo criterio del módulo 1 §7).

## 4. ItemDetail — página dedicada `/biblioteca/[id]` (decisión: PÁGINA, no modal)

Motivo: necesita búsqueda interna para conectar (ItemConnectPicker); sheet dentro de sheet es un pozo móvil y pierde el contexto de la stack.

- Header 48px: back arrow 44px + título "Detalle" (el contenido de la página habla, no el título).
- **Hero:** si el item es arte con imagen → cover full-width alto máximo 40dvh; texto/voz/link → bloque compacto con icono-tipo sobre `--accent-soft` y texto/URL subrayada si es link.
- **Nota (editable):** textarea auto-crece, placeholder "Escribe algo sobre esta idea..."; controles mínimos **[B] [bullet]** accesible en la barra encima del teclado. Render: negrita `--text` semibold, lista con bullets `--text-soft`. Nota vacía = no bloque, solo placeholder dentro del textarea (menos cromo).
- **Metadatos:** fila tipo (icono + "Texto"), fecha completa, origen ("Capturada de la Bandeja · hace 3 días"), colecciones como chips legibles (tappable para ajustar).
- **ConexionesPanel (core del loop):** título serif **"Conexiones"** + lista dirigida idea→idea: cada row `Card mini` con flecha "→" + título de la otra idea + nota corta "por qué" + botón quitar (icono x, 44px). Vacío: texto suave "Nada conectado aún."
- **Conectar con…** botón secundario full-width (outline `--text`, h-44) → abre ItemConnectPicker inline (expand en la página, NO modal): input de búsqueda con lupa, foco automático; MIENTRAS escribes debajo se lista la coincidencia del resto de items: mini-card con icono de tipo + primeras 2 líneas del texto + dot de colecciones; "Escribiendo…" y estado vacío: "Nadie coincide con esto." El tap elige y abre entrada inline de nota opcional "¿Por qué lo conectas?" (placeholder así) + botón "Conectar".
- **Conexión duplicada (DECIDO: sí se avisa):** si la conexión ya existe, el row aparece igual pero el botón "Conectar" va deshabilitado con hint inline "Ya están conectadas." (prevención de error, Nielsen #4; el duplicado silencioso sería dolor invisible).
- **Acciones bajo el panel:** fila: Archivar (reversible, sin confirm), Eliminar (danger: confirm inline 2-tap + UNDO 6s Y también funciona en esta página — mismo patrón del módulo 1).

## 5. Colección nueva inline (dentro de CategorizarSheet)

- Fila compacta al final de la lista de colecciones: input h-44 "Nombre de la colección..." + botón "+" (h-44).
- Junto al input va la fila de **dots de color** (los 8 de §1), legendada "Color (opcional)"; opción extra es un dot vacío de borde — si no eliges, la colección queda sin color. El dot elegido crece sutil con anillo.
- Crear: la colección nueva aparece como chip ACTIVA en el sheet (la idea ya va rotulada). Nombre duplicado = mensaje inline "Esa colección ya existe" y foco en el input (no error modal). Colección se crea solo al guardar "Listo" si quedó activa — no en el tap "+", para no ensuciar si cancela.

## 6. Estados nuevos del módulo (resumen)

| Dónde | Estado | Tratamiento |
|---|---|---|
| Biblioteca | sin items | EmptyState sticker 🎨 + "Tu biblioteca está prendiendo." (ver §2) |
| Biblioteca | sin colecciones | No es pantalla vacía; chips solo "Todas"+"Sin colección" + línea sutil |
| Biblioteca | carga | Skeletons 2×3 del grid (shimmer desactivado con `prefers-reduced-motion`) |
| Biblioteca | error | Banner inline "No pudimos cargar tu biblioteca. Reintentar" |
| Biblioteca | archivadas | Toggle texto sutil esquina "Ver archivadas (n)"; archivada se ve opacity 0.55 + chip "Archivada"; excluida de búsqueda default |
| Detalle | nota vacía | Placeholder del propio textarea |
| Conectar | sin resultados | "Nadie coincide con esto." dentro del picker |
| Conectar | duplicada | Botón deshabilitado + "Ya están conectadas." (aviso sí, inline) |
| Categorizar | duplicada colección | Inline "Esa colección ya existe" + foco en input |

## 7. Accesibilidad WCAG AA (solo lo NUEVO; el resto = módulo 1 §4)

- **Chips:** colección activa text `--text` sobre `--accent-soft` ≥7:1; los DOTS son decorativos y SIEMPRE van con el nombre legible al lado; el dot hueco de "Sin colección" también aria-consistente.
- **Chips interactivas:** contenedor con `role="group" aria-label="Colecciones"` + cada chip `<button aria-pressed>` con `aria-label="Colección Arte"`; el filtro de tipo igual con `aria-pressed`. Tap-target ≥44×44: los chips visuales h-8 llevan hit-slop o contenedor `py-2` que garantiza 44px reales.
- **Focus ring:** 2px `--accent` offset 2 en TODOS los chips, inputs, botones, back-arrow; `focus-visible` nunca `outline-none` a secas.
- **Semáforo ✓:** `role="img" aria-label="Categorizada en Biblioteca"` — nunca el check solo.
- **ItemConnectPicker:** input con `aria-label="Buscar más ideas para conectar"`; resultados `aria-live="polite"` con cuenta "3 resultados"; rows botones full con nombre accesible "Conectar con: {titulo}".
- **Toggle archivadas:** botón text 13px `--text-soft` ≥44px y `aria-expanded` (es reveal, no link muerto).
- **Sheets/dialogs:** rol `dialog aria-modal`, ESC + tap fuera cierran, focus trap y devolución al trigger.
- **Touch targets:** back arrow 44, "quitar conexión" 44, "[B] [bullet]" 44, botón "+" de colección 44.

## 8. Copy en español (nuevo — tono igual: directo, humano, segunda persona)

| Dónde | Texto |
|---|---|
| Título tab | `Biblioteca` |
| Buscar | `Buscar en tu biblioteca...` |
| Chip todas (default) | `Todas` |
| Chip vacío | `Sin colección` |
| Toggle archivadas | `Ver archivadas (3)` / `Ocultar archivadas` |
| Sin items título | `Tu biblioteca está prendiendo.` |
| Sin items sub | `Categoriza una idea de tu Bandeja hacia Biblioteca y aquí queda guardada.` |
| Sin filtro resultado | `Nada con esos filtros.` + botón `Limpiar filtros` |
| Sin colecciones hint | `Las colecciones se crean al categorizar.` |
| Error carga | `No pudimos cargar tu biblioteca. Reintentar` |
| Sheet categoría título | `¿Dónde vive esta idea?` |
| Destino único | `Biblioteca creativa` |
| Destino deshabilitado (row gris) | `A un proyecto — viene pronto` |
| Sección colecciones | `Colecciones` |
| Input nueva colección | `Nombre de la colección...` |
| Legend dots | `Color (opcional)` |
| Botón guardar sheet | `Listo` |
| Duplicado colección | `Esa colección ya existe` |
| Semáforo ✓ (aria) | `Categorizada en Biblioteca` |
| Detalle nota placeholder | `Escribe algo sobre esta idea...` |
| Conexiones título | `Conexiones` |
| Conexiones vacío | `Nada conectado aún.` |
| Botón conectar | `Conectar con...` |
| Placeholder búsqueda conectar | `Buscar más ideas para conectar...` |
| Picker vacío | `Nadie coincide con esto.` |
| Nota de conexión (opcional) | `¿Por qué lo conectas?` |
| Botón confirmar conexión | `Conectar` |
| Duplicada hint | `Ya están conectadas.` |
| Meta origen | `Capturada de la Bandeja` |
| Acción archivar | `Archivar` |
| Acción eliminar | `Eliminar para siempre` |
| Quitar conexión (aria) | `Quitar esta conexión` |
| Quitar de Biblioteca (sheet ✗) | `Quitar de Biblioteca` |

## 9. Componentes con props tipados (contrato para code-implementer — el archivo TERMINA con esta lista)

Regla final para el coder: `DotColor` es la unión de los 8 nombres de token de §1; nada cambia los tokens base; sin librería de edición rica (ni tiptap/slate).

```tsx
BibliotecaGrid
  // Orquesta el grid: filtra por chips+tipo+busqueda, gestiona loading/empty/error/archivadas
  { items: BibItem[]; colecciones: Coleccion[]; isLoading: boolean; error?: string;
    coleccionesActivas: string[]; tipo: 'todo'|'texto'|'voz'|'link'|'arte';
    verArchivadas: boolean; query: string;
    onToggleColeccion: (id: string) => void; onToggleVerArchivadas: () => void }
  // BibItem = idea con estado incluye: nota? (string), imagenUrl?, colecciones: string[] (ids)

ColeccionChip
  // Pill interactive h-8 visual + tap 44: dot de color + nombre
  { coleccion: { id: string; nombre: string; color?: 'terracota'|'mostaza'|'oliva'|'petroleo'|'tinta'|'violeta'|'rosa'|'marron' };
    active: boolean; onToggle: (id: string) => void }

ColeccionChips
  // Scroll-x de 'Todas' + 'Sin colección' (dot hueco) + ColeccionChip(s), group aria
  { colecciones: Coleccion[]; activas: string[]; onToggle: (id: string) => void;
    sinColeccionActiva: boolean; onToggleSinColeccion: () => void }
  // 'Todas' es estado computado: ninguna colección activa Y sin-coleccion inactivo

TypeFilterSegment
  // Single-select Todo/Texto/Voz/Link/Arte, h-44, aria-pressed
  { value: 'todo'|'texto'|'voz'|'link'|'arte'; onChange: (t: string) => void }

CategorizarSheet
  // Sheet 'dialog': preview, destino unico Biblioteca, coleccion chips + inline nueva, Listo
  { ideaId: string; ideaPreview: string; colecciones: Coleccion[];
    onSave: (payload: { coleccionesIds: string[]; nuevas: { nombre: string; color?: DotColor }[] }) => Promise<void> }

ColeccionPickerInline
  // Fila NUEVA coleccion dentro del sheet: input nombrar + fila 8 dots (color opcional)
  { onCreate: (nombre: string; color?: DotColor) => void; nombresExistentes: string[] }

ItemDetail
  // Página: hero, nota editable, metadatos, ConexionesPanel, acciones (archivar/eliminar)
  { item: BibItem; colecciones: Coleccion[]; conexiones: Conexion[];
    onSaveNota: (texto: string) => Promise<void>;
    onArchivar: (id: string) => Promise<void>; onDelete: (id: string) => Promise<void>;
    onBack: () => void }
  // Conexion = { id: string; desdeId: string; haciaId: string; nota?: string; creadoEl: string }

ConexionesPanel
  // Lista dirigida idea→idea + nota 'por qué'; quitar conexión inline
  { conexiones: Conexion[]; items: Record<string, { titulo: string; tipo: string }>;
    onRemove: (id: string) => void }

ItemConnectPicker
  // Búsqueda inline dentro del detalle: resultados filtrados + confirmar con 'nota por qué'
  { items: Array<Pick<BibItem, 'id'|'titulo'|'tipo'|'colecciones'>>;
    conectadasYa: string[]; // ids: aviso duplicado deshabilita el botón
    onConnect: (haciaId: string; nota?: string) => Promise<void> }

NotaEditor
  // textarea auto-grow + [B]/[bullet] minimal; solo strong/listas — límites §1
  { value: string; onChange: (v: string) => void; onSave: () => Promise<void> }
```
