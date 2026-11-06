# Mente (nombre provisional) — Documento Fundacional

Estado: APROBADO por David (2026-11-01). Este documento se congela; cambios posteriores = enmienda documentada en `docs/history/decisions-log.md`.

## El problema que resuelve
Mis ideas se dispersan entre WhatsApp, Notion, Todoist y reels guardados: las capturo pero nunca las conecto ni las uso, y nadie me avisa cuando mi atención se dispersa entre demasiados proyectos.

## Recetas inspiradoras (analizadas con REA, evidencia retenida)
- **albo.inc** — captura cero-fricción, un inbox, AI organizadora, "do the things you've saved" (Next.js + Vercel; Apple Garamond + Instrument Sans).
- **Notion simplificado** — bloques ligeros + enlaces, el LÍMITE: no bases de datos infinitas, no jerarquías que se pudren.

## Qué DEBE hacer el sistema
1. **Captura cero-fricción:** texto, voz, links y screenshots desde web/PWA móvil en segundos (<5s).
2. **Extensión de Chrome:** guardar una web, tomar captura de pantalla, o subrayar contenido de una web y llevarlo al sistema con un clic.
3. **Inbox único:** todo entra por allí, nada se pierde.
4. **AI organizadora:** clasifica y sugiere categoría/proyecto — siempre sugiere, tú apruebas. Nada automático sin confirmación.
5. **Expansión semántica:** al capturar contenido (reel, video, artículo) lo transcribe, extrae entidades (autores, libros, lugares, personas) y propone conexiones con ideas dentro del sistema y con conocimiento externo (ej: otros libros del mismo autor).
6. **De contenido a tareas:** cualquier captura/reel/video puede convertirse en lista de acciones/tareas en un clic (ej: reel de rutina → lista de ejercicios).
7. **Biblioteca creativa:** apartado para arrojar todo ideas creativas — arte, copy, videos, referencias visuales, piezas de cualquier tipo — ordenadas en colecciones por tipo y tema, sin carpetas rígidas. En cada item puedes pedirle a la AI que te **explique** sobre él (qué es, por qué funciona, cómo se conecta con lo tuyo).
8. **Ideas conectadas:** bloques ligeros con enlaces entre notas, sin jerarquías rígidas.
9. **Proyectos con Panel de Foco:** pocos proyectos desplegados a la vista; los demás quedan plegados (escondidos pero permanentemente accesibles en el apartado de Foco — nunca bloqueados). El sistema muestra dónde estás poniendo tu atención y dónde la estás perdiendo.
10. **Guardián suave:** avisa "esto choca con tu foco", "tienes demasiado en el aire", "esto está desordenado, ¿lo ordenamos?" — sugiere, nunca impide.
11. **Higiene asistida:** detecta lo que lleva tiempo sin usarse y pregunta directamente: "nunca lo has usado, ¿lo necesitas realmente?" — archivar/eliminar en un clic, con tu aprobación.
12. **Copiloto de objetivos:** el sistema pregunta "¿qué quieres lograr?" y contigo lo convierte en plan de tareas; después guía: "entonces, hoy toca esto y esto".
13. **De capturar a hacer:** ideas se convierten en acciones/tareas ligadas a proyectos — "guardado" se vuelve "hecho".
14. **Diseño que te guste:** limpio, visual, card-based estilo Albo; verificado en vivo con REA: fondo crema/cálido, tipografía display con carácter + sans humanista, un solo color de acento, emoción en detalles tipo sticker/pill (Notion), y barra de captura estilo WhatsApp siempre visible abajo.

## Qué NO debe hacer (límites explícitos)
- El sistema no bloquea ni esconde proyectos por su cuenta — solo avisar. Ocultar/plegar proyectos es decisión del usuario y se hace dentro de Foco; todo sigue accesible siempre.
- No bases de datos complejas, no plantillas infinitas estilo Notion-full.
- Ninguna acción de la AI sin aprobación manual (en v1).
- No calendario, no correo, no gestión de otras apps (v1).
- No integración con WhatsApp (v1 — posible en v2).
- No multiusuario ni colaboración — es solo para ti.
- No rastrear tu tiempo de uso de teléfono/navegador (es v2).

## Estructura de la app — 3 apartados (definida por David, 2026-11-01)

1. **Foco** — allí viven los proyectos. Cada proyecto puede contener: **investigaciones** (cada una con sus items/notas), **notas** y **tareas**. Por defecto solo pocos proyectos están desplegados; el resto queda guardado dentro del mismo apartado de Foco (accesible en 1 clic).
2. **Bandeja de entrada** — todo lo que entra vive aquí, categorizado o no; se ve de un vistazo el estado de cada cosa. La AI categoriza si es obvio; si no, lo categorizas tú. Categorizar = enviar a: un proyecto, una investigación dentro de un proyecto, o la Biblioteca creativa.
3. **Biblioteca creativa** — allí viven las ideas, arte y demás (colecciones, ver punto 7).

## Flujo lógico principal
1. Ves algo interesante → 1 clic desde móvil o navegador → Inbox.
2. La AI lo analiza: transcribe, extrae entidades, sugiere categoría/proyecto/conexiones — y si tiene pasos accionables, ofrece generarlo como lista de tareas.
3. Apruebas con un toque → la idea queda en tu biblioteca, conectada.
4. Abres el Panel de Foco: proyectos visibles, distribución de tu atención, avisos del guardián si es hora.
5. Si tienes un objetivo grande, lo conversas con el copiloto: él pregunta, ustedes descomponen tarea por tarea, y te lo devuelve como "hoy toca esto y esto".
6. Las ideas con peso se convierten en acciones → los proyectos avanzan → "guardado" se volvió "hecho".
7. Periódicamente el Guardián señala lo viejo sin uso: "¿esto sigue vivo o lo soltamos?" — la biblioteca se mantiene ligera sin esfuerzo.

## Definición de éxito
- Puedes capturar cualquier cosa en menos de 5 segundos desde móvil o navegador.
- Lo abres 3+ veces al día porque te aporta, no porque te obligue.
- En 2 semanas, la mayoría de tus capturas tienen al menos una conexión o apareció una acción.
- El guardián te salva al menos una vez de empezar el cuarto proyecto cuando hay tres en el aire.
- La pregunta "¿qué quieres lograr?" termina en un plan real de tareas y una próxima acción con fecha.
- Después de un mes, la biblioteca no se ha vuelto acumulador de basura inactiva.
- Te gusta abrirlo. Si el diseño no engancha, el sistema muere.

## Versión 2 (pospuesta, NO es v1)
- Auditoría de tiempo: ver en qué has gastado tu tiempo en el teléfono y en el navegador, contrastado con el Panel de Foco.
- Conector MCP: conectarse a cualquier AI externa vía MCP y usarla como herramienta.
- **Agente de Mente con MCP de opencode + asistente AI (Muse/Grok)** — el comportamiento que David definió (2026-11-06): el agente solo maneja info DENTRO de Mente; distingue qué hace él vs. qué necesitan opencode/assistant; les deja la info ya preparada en el formato correcto para cada uno; detecta cruces de tareas y conflictos de recursos/tiempos; avisa honestamente "con estos recursos y este tiempo, mejor opción: A o B" (enfoque en soluciones, no quejas).
- **Importar memoria**: traer historial/memoria desde Claude y ChatGPT y texto plano de chats de WhatsApp al Inbox de Mente.
- **Bandeja con fotos y videos** (clasificación pendiente: fotos = completaría punto #1; video = v2 claro).
- **Coach de foco**: AI activa que pregunta cómo vas, con capacidad resolutiva y consultiva para planificación (clasificación pendiente: ¿extensión del copiloto v1 o v2?).
- **Biblioteca redesign**: "aquí es todo diseño" — David definirá la interfaz.
- **Comportamiento no-determinista de la AI externa** (módulo 10): equilibrio determinista↔exploratorio según caso — David definirá cuando toque.
- Programador/Activador: agendar tareas (una vez o recurrentes) que el sistema dispara contra la AI conectada — el sistema adolescente/inicia/estimula: al llegar la hora, carga el contexto y lanza a la AI para que ejecute. Nota de diseño: dos modos configurables — con aprobación (default) o autónomo para tareas seguras.
- Exponer el sistema como servidor MCP hacia otras herramientas.
- Captura por WhatsApp.

## Módulos identificados (orden de construcción — v1)
1. **Fundamento:** cuenta + Inbox + captura básica (texto, voz, link) + PWA
2. **Biblioteca creativa:** colecciones por tipo/tema (arte, copy, videos, referencias) + notas con bloques ligeros + conexiones entre ideas
3. **AI organizadora + expansión semántica:** transcripción, entidades, conexiones, sugerencias aprobables, contenido → tareas, **explicar item bajo demanda**
4. **Proyectos, Objetivos y Panel de Foco:** panel + guardián + copiloto de objetivos
5. **Extensión Chrome:** guardar link, screenshot, subrayar → captura
6. **Share-target móvil:** compartir desde cualquier app + screenshots a proyecto
7. **Acciones/tareas** ligadas a ideas y proyectos

Regla permanente: toda idea nueva que surja después de este documento va a la sección Versión 2 — la v1 no crece de alcance o no se termina nunca.
