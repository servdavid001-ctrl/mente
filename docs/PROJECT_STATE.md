# PROJECT_STATE — Mente (provisional)
Última actualización: 2026-11-01

## Estado actual
Módulo completado: Fundamento (módulo 1) — login + bandeja funcional + capture texto/voz/link + PWA, build verde (62c8de9).
Siguiente módulo: 2. Biblioteca creativa.

## Módulos completados
| Módulo | Rutas | Tablas | Estado |
|---|---|---|---|
| 1. Fundamento | /, /login, /api/ideas[/id] | ideas + storage ideas-audio | ✓ (con deuda menor, abajo) |

## Deuda del modulo 1 (para el siguiente modulo o enmienda)
- Foco y Biblioteca = placeholders de la spec del modulo 1 (se construyen en modulos 2 y 4).
- Confirmacion por email: signUp queda sin sesion hasta confirmar (Auth del proyecto); el flujo principal v1 es signIn.
- Nota de voz: la card guarda ruta en el bucket y reproduce con URL firmada on demand; el archivo de audio no se borra si la idea se elimina (orphan аудio — limpiar en higiene asistida).
- Archivadas: columna archivada (adicion documentada a 0001, desviacion justificada del enum estado); no hay UI de ver archivadas (higiene asistida la trae).
- SW offline: manifest listo pero no service worker custom (v1 PWA minima).

## Módulos pendientes (orden)
1. Biblioteca creativa: colecciones (arte, copy, videos) + notas + conexiones
2. AI organizadora + expansión semántica + explicar item bajo demanda
3. Proyectos, Objetivos y Panel de Foco
4. Extensión Chrome
5. Share-target móvil
6. Acciones/tareas

## Bugs abiertos AHORA
(ninguno)

## Últimas decisiones
- 2026-11-01: Estructura de app definida por David: 3 apartados (Foco / Bandeja / Biblioteca creativa). Proyectos plegables por decisión del usuario, nunca bloqueados.
- 2026-11-01: MCP conector + programador/activador → movidas a v2 por decisión de David.
- 2026-11-01: Captura por WhatsApp → v2 (posible), no v1.
- 2026-11-01: Nombre provisional "mente" hasta que David defina el definitivo.
- 2026-11-01: Backend confirmado: Supabase (David). Convex MCP deshabilitado.

## Alertas activas
- Backend confirmado: Supabase. Falta: URL + anon key + service_role key de David (se piden UNA vez) para conectar auth y tabla ideas del módulo 1.
- MCP convex deshabilitado tras decisión de backend.
- Referencias de diseño analizadas con REA: albo.inc + notion.com (evidencia en sesión 2026-11-01).
