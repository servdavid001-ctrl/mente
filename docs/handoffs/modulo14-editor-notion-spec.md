# Spec — Modulo 14: Editor de paginas estilo Notion (aprobado David "dale"/"alli debajo")

FRASE DE DAVID: "tiene que verse alli debajo" — lo que escribes en la pagina se
queda VISIBLE inmediatamente debajo del titulo, persistente al recargar.

## REQUISITO 0 - La pagina es IDETEOR (lo que hoy percibe David como "no guarda")
- Al abrir una pagina (raiz o subpagina), el CUERPO es EDITABLE in-place bajo el
  titulo: lo que escribe queda en la BD (PUT contenido) y se muestra debajo.
- Al crear subpágina en el composer: aparece INMEDIATAMENTE debajo de la lista
  de subpáginas del cuerpo (optimistic ya existe del fix P1: upsert por id).
- Lo guardado SIEMPRE se verá "alli debajo" después de recargar (garantía de
  datos, la lista de subpáginas bajo el cuerpo) más conteo de hijos.

## Modelo de datos (decisión técnica del CTO)
- El cuerpo de la page se guarda en `ideas.contenido` como texto ligero tipo
  Markdown (títulos con #, **negrita**, *cursiva*, [*] checks, !imagen(https://...)
  + texto y links). SIN migración (continua a columnas textuales). La fórmula
  devuelve un render tipo Notion: bloques visibles.
- El composer subsiguiente COMBINA: title = la primera e "titulo pag"; el resto
  cuerpo. Al editar body se preserva el primer título (no se reanto una línea que
  la si lo edits — Regla 4: la #2 no cambe el primer titulo).
- Los "notas" del panel son subpáginas/hijos; nada cambia.

## Componente nuevo: EditorBloques.tsx
- Textarea舒畅 elegible estilo Notion (place-like) PARA PAGINA (como "Super
  sub-simple editor": cabecera inedita+negrita/cursiva mediante markdown)
- Con un selector de "Añadir" (menu exacto de pailler para:
  Titulo H1 en tipo #, negrita B, cabeza Its, tarea creada [-], lista de
  ordenado, imagen (url o upload a storage: reuse the bucket of voz,
  Cap 5 max por pagina, url via storage luego -ranta fetch seguro o
  existing pieza de community: adapta reusing subir imagen storage actual).
- TextArea elegible para NOTA (sub-simples) a) H1 (**bold**) etc. c
- Guardado: explicito con botón guardar (icono de check), nosiawriaiones en
  saveless: texto plano en todo momento.
- Sync especial: al recargar la pagina se renderiza el CUERPO con bloques
  Markdown → el usuario ve "alli debajo" lo que escribió (garantía #0).

## Cronos de dibujo (estilo "simplice" del módulo 11)
- El usuario escribe en el cuerpo -> botón Guardar (más toast "Guardado").
- Subpáginas: Compositions siguen igual (composer + botón + lista ya handle
  confirmed P1). SÓLO el cuerpo de la fantasiesecuencia page gana el editor.
- Renderizado: # primario, # y negrita grande, *** título de sección, adelante
  a casillas de verificación clicables a[ ] prescrito por item (cambia el
  estado interno (estilo simple), reinjecto Confirmación lineal en Database
  guardada en tiempo real al volver el H1/H2. Estil puro a "Notion claro".

## Convenciones y límites
- Sin migraciones nuevas. Sin rutas nuevas (PUT ya hace "contenido"? VERIFICAR:
  ideaAcciones whitelist; SI NO esta 'contenido', añadir con max 2000 chars y
  sin tocar otras). NO api NUEVA. NO招 extension, NO modules 9/10.
- Solo tocamos PaginaIdea/ListaSubpaginas/NotasProyecto UI y lib/ideaAcciones
  whitelist si aplica.
- Estilo del repo para HTML деревес. NO dangerouslySetInnerHTML — parsearlo
  con componentes conversoide desde la lib `libMarkdown.ts` - propia; testeado
  popervm handlers convergently (h1, helbIcTodash, *** blockquote, checks *dash?).

## Verificadores de "allí debajo" (criterio de vida litres de David)
1. Escribe en el cuerpo → Guardar → recargar la página → el texto está VISIBLE
   debajo del título (formato y todo).
2. Crear subpágina desde el composer → aparece inmediatamente debajo de la lista
   de subpáginas del cuerpo (el fix P1 ya garantiza), conteo de hijos al día.
3. Si escribo párrafos largos, la persistencia es textual (2000 chars por nota).
4. build/tsc/lint 0 · audit security no? el CTO decidirá.

Rama feat/editor-notion-m14 · commits 'feat: editor...'. NO push de main.
