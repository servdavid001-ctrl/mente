# Spec — Modulo 10: Conexiones con conocimiento externo (punto #5 FOUNDATION)

DELEGA A: code-implementer · Decision de David: combinacion de catologos publicos + AI
ya activa del usuario. Fichas de libros externos viven DENTRO de la idea (nada de notas
fantasmas en la biblioteca).

## Micro-contrato (REGLAS SAGRADAS)
- Nada automatico: las conexiones externas llegan como SUGERENCIA de tipo `externa`,
  con el mismo flow aceptar/descartar/descartar_permanente de /api/ai/sugerencias/[id].
  SOLO al aceptar se guardan dentro de la idea (ideas.entidades.externa jsonb).
- Catálogos publicos SOLO LECTURA sin API key: Google Books (www.googleapis.com/books/v1/volumes)
  + OpenLibrary (openlibrary.org/search.json). Timeout 5s maxima. Fuentes fijas, nunca URLs
  controladas por el usuario (prohibido SSRF).
- Dedup: mismo titulo normalizado (lowercase, sin signos) de ambas fuentes NO se duplica;
  se marcan con `fuente: 'google_books' | 'openlibrary'`; AI match se marca `fuente:'ai'`.
- Vos si hablamos books domain; la AI solo PROPOSE conexiones conceptuales (metodo,
  corriente, concepto) con su nombre e intento, sin textos largos.
- Rate compartido 'consumir_analisis' (otro consumo mortal del flujo ya existente).
- Sin tabla nueva: aceptar retorna en ideas.entidades.externa como
  `externa: Array<ItemExterno>` junto a la `lista` existente del jsonb. `ai_minuta` continua.

## Detalle David (OBLIGATORIO)
- Un reels habla de un libro → el sistema detecta el nombre → ficha enlazada con:
  portada (`coverUrl`), titulo, autor, año, fuente, y UNA frase de la AI "por que te
  serviria leerlo para x o y cosa" (personalizada al contenido de la idea).
- Portadas: Google Books `volumeInfo.imageLinks.thumbnail` (o fallback con isbns);
  OpenLibrary `covers.openlibrary.org/b/<isbn|olid>-M.jpg`. Renderizar con <img
  loading="lazy" width por 2 en proporciones> porque Next/image require dominios
  allow-list; usar <img> plain y dejar la regla de lint como warning (no error).
  Si la case no llega: placeholder CSS con iniciales del titulo.

## API nueva: POST /api/ai/externa/[id]
Auth 401. Body: nada (usa las entidades ya guardadas de esa idea).
1. Lee idea (SELECT_IDEA); usa `ideana.entities.lista` (entidades tipo autor|libro|concepto).
2. Por cada entidad tipo `autor` o `libro`: 1 GET a Google Books; 1 GET a OpenLibrary.
   Google: `?q=inauthor:"<nombre>"` o `intitle:"<nombre>"` → max 8 items:
   `{fuente:'google_books', titulo, autor:volumen.authors[0], anio:volumen.publishedDate
   (4 digitos), coverUrl:thumbnail, url:previewLink||infoLink, frase:null}`
   OpenLibrary igual con `?q=` o `?author=`; shape igual vocacion.
   Dedup tipografia: lowercase, sin acentos, sin espacios replicados; antes de AI.
3. IA UNICA llamada (llamada JSON como analizar): rechaza favorablemente matches
   conceptuales `fuente:'ai', titulo:"<concepto/corriente/metodo>", autor:null,
   coverUrl:null breve` + para fichas de libro ya detectadas genera `frase` de 1 linea
   ("este libro es brutal para x o y porque tu idea habla de..."). Acepta 12 items max.
4. Crea UNA sugerencia nueva con payload = `{items: [...], generado: '<date>'}` y
   tipo `externa`. NO toca entidades aún. Respuesta: `{sugerencia}`.
Rate: `consumir_analisis` antes de empezar (mismo max/castigo que analizar).
Error: cero datos inventados si catalogo falla (falla ese "fuente" se vacia el grupo).
Nunca filtra errores PostgREST ni URLs de catologo al cliente (error generico).

## ACEPTAR / DESCARTAR
En `PUT /api/ai/sugerencias/[id]` accion=`aceptar` para tipo `externa`:
- al aceptar externa: agrega `items` al array `ideas.entidades.externa` (array nuevo
  — si ya existia, merge por titulo+autor, no duplicados; si la fila idea no tenia
  entidades por que nunca se popularo con analizar, CREAMOS el objeto jsonb con
  `{lista:[], externa:[...]}`).
- se marca aceptada como hoy (estado persistente tipay payload).
- descartar: no muta la idea, solo estado descartada. descartar_permanente: hash.

## UI
1. `SeccionExterna`: card en la ficha de la idea (dentro de la VIEW de la idea ya
   existente, no pagina nueva) — sección "Conectado con el mundo". Muestra ficha
   horizontal: portada 48x72 rem + titulo + autor + año + fuente + la frase AI
   (1 linea, texto plano). Toca abre la url externa en nueva pestaña.
2. `SugerenciaExterna`: sheet de sugerencia con lista de items (con checkbox)
   + botones Aceptar seleccionadas / Descartar.
3. Button "Buscar conexiones externas" en la ficha para ideas que hayan sido
   analizadas arriba o tu pip que quieras el juego de entidades (aparece SI la idea
   tiene `entidades.lista` con autor|libro NO vacio) y estil to ok.

## Verificaciones del repo ANTES de codesar
- Como guarda `analizar` las entidades (`ideas.entidades`) para no romper el shape
  (aplica cambios no-destructivos, solo push de 'externa' key).
- El flujo exacto del provider usado en 'analizar'.
- Como accede `api/conexiones` para conecion interna (reusar el nombre del sheet).
- Layout, estilo, colores de sugerencias sheets existentes.

## Convenciones inalterables del repo
- Archivos >100 lineas: escribir en partes y verificar.
- No tocar features/, tests, sugerencias sheets del modulo 1-7 fuera de las 2 lineas quitas.
- Nunca ejecutar build con next vivo: pkill -9 -f next-server → rm -rf .next → npm run build.
- `npm run build 2>&1 | tail -20` antes de commit (formato 'feat: externas').
- Sin tildes en strings JSX.

## Criterio de terminado
build/tsc/lint 0 · auth 401 sin sesion · error 500 generico · creado y probado
con datos reales en QA manual: idea con entidades → POST externa → sugerencia con
portadas de 2 fuentes + frase IA → aceptar ENTOCES guarda en entidades.externa
(dict submission) → descartar deja 0 rastro. Reporta el diff y lo retirado (esto queda para el CTO)+ how to visualmente david debe comprobar se indicara.
## Verificacion final antes de reportarme
1. `npm run build 2>&1 | tail -20` → 0.
2. curl POST sin sesion → 401.
3. git diff --stat del modulo completo (files list + lines).
