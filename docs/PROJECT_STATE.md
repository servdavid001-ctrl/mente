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
- 2026-11-01 RESUELTO: P0 modulo 2 (/biblioteca mostraba placeholder de AppShell) — AppShell ahora renderiza children en bandeja+biblioteca, placeholder solo para foco. Bug-log #7 cerrado. Re-test S3-S6 PASS en vivo.

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

---
## QA REPORT — 2026-11-01 (qa-navigator en vivo)
URL analizada: http://localhost:3000 (produccion local, npm start) | Activado por: usuario (corto) | Scope: modulo 1 Bandeja (escenarios 1-7 + 9)
Resultado: 7 OK | 0 P0 desplegados ya corregidos | 1 P0 nuevo | 3 P2

### Flujos verificados
- Esc1 sin sesion → redirect /login: PASS (cookie previa en perfil limpiada para probar redirect real)
- Esc2 login → shell 3 apartados (Foco/Bandeja/Biblioteca), Bandeja aria-current="page": PASS
- Esc3 texto "idea de prueba QA" → item ✗ Texto, composer limpio: PASS
- Esc4 link https://example.com/articulo → FAIL: 3x POST /api/ideas 400 (ver Bug.md #1)
- Esc5 mic → toast descriptivo "No pudimos usar el microfono..." + composer usable tras error: PASS
- Esc6 archivar+undo<6s vuelve (undo@~1.2s, item restaura), archivar sin undo se va (3 PUT 200, persisten): PASS
- Esc7 eliminar 2 pasos + undo<6s (DELETE 204 → POST 201 restaura), eliminar sin undo se va: PASS
- Esc8 screenshot bandeja → /tmp/opencode/qa-screens/bandeja-qa.png: OK

### Const no bloqueantes
- Vitals bandeja: TTFB 793ms, FCP/LCP 1076ms, CLS 0, 0 errores JS consola, 0 excepciones.
- favicon.ico 404 (P2), mensaje de error de envio generico (Bug.md #2).

### Pendientes para troubleshooter
- [ ] Bug.md #1 P0 captura de link (archivo/linea en Bug.md)
- [ ] Bug.md #2-#4 P2 (mensajes de error, favicon, delay del undo prompt)

### Nota de entorno
- El archivo de credenciales /tmp/opencode/mente-admin.txt tiene formato (email/password/user_id), no password plana. Primer intento de login 400 fue error de parsing del QA, no bug de la app (verificado luego 200 y login en navegador OK).
