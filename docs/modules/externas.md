# Modulo 10 — Conexiones con conocimiento externo (punto #5 del FOUNDATION)

Fecha de cierre: 2026-11-06 · Merge main: 23237d4 · Security audit: APROBADO (tras fixes) · Deploy prod: OK

## Qué hace (2-3 lineas)
Una idea con entidades detectadas (autor | libro) puede buscar "conectado con el
mundo": catalogos publicos (Google Books + OpenLibrary, sin API key) devuelven obras
reales del mismo autor/tema y una UNICA llamada AI (clave del usuario) agrega
conceptos conexos y la frase personalizada ("este libro es brutal para x o y").
Todo llega como SUGERENCIA: nada automatico. Al aceptar, las fichas quedan DENTRO
de la idea (tarjeta enlazada con portada, autor, anio, fuente, link) — no notas
fantasma en la biblioteca.

## Tablas / migraciones
- `0010_sugerencias_externa.sql`: amplia el CHECK de `sugerencias.tipo` con
  `'externa'` (aplicada y verificada con prueba funcional contra prod; el MCP global
  de Supabase sigue apuntando a otro proyecto — migrar via CLI).
- Sin tablas nuevas: fichas aceptadas van a `ideas.entidades.externa` (jsonb, merge
  deduplicado por titulo normalizado + autor).

## Rutas
- `POST /api/ai/externa/[id]` — auth 401, rate `consumir_analisis`, timeout 5s por
  fetch, caps: 6 entidades, 8 items/fuente, 12 AI total, error generico.
- `PUT /api/ai/sugerencias/[id]` (aceptar tipo `externa`): merge validado en el
  jsonb con los items seleccionados del sheet.
- UI: `SeccionExterna` ("Conectado con el mundo" en la ficha de idea),
  `SugerenciaExterna` (sheet con checkboxes), `ExternaBoton`/`ExternaPanel`/`PortadaExterna`.

## Decisiones tecnicas
- Combina las 2 fuentes: catalogos (datos duros complejos) + AI (conceptual);
  dedup compartido por titulo normalizado, cada ficha etiquetada con su fuente
  (`google_books` | `openlibrary` | `ai`).
- Portadas via `<img loading="lazy">` (warning de lint consciente; allowlist de
  next/image queda como hardening MA4).
- `guardarMinuta` hace spread del jsonb previo (1 linea) para no borrar la key
  `externa` al aceptar una minuta.

## Bugs resueltos (del audit)
- B1 (critico): la BD rechazaba tipo 'externa' por el CHECK viejo de 0004 →
  migracion 0010 aplicada y verificada.
- B2 (alto): AbortSignal a nivel de modulo => catalogos muertos tras 5s de proceso
  en servers warm → signal per-call.
- MA1: sanitizacion de comillas/backslash en la query de Google Books.

## Deuda menor (audit, no bloquea)
- MA2: cuota se consume antes de la lectura de la idea (alinear orden con analizar).
- MA3: merge jsonb read-then-write sin transaccion (lost update improbable, single-user).
- MA4: coverUrl valida https pero sin allowlist de dominios.
- MA5: res.json() de catalogos sin cap de tamano.
- Ampliar dominios (musica/peliculas/lugares) = Versión 2 (regla del FOUNDATION).

## Alineación con FOUNDATION
Punto #5: "propone conexiones con ideas dentro del sistema Y con conocimiento
externo (ej: otros libros del mismo autor)" ✓ bajo la regla #4 del FOUNDATION:
"la AI sugiere, tu apruebas" — ficha enlazada dentro de la idea ✓ (induccion David).
