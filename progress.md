
---
## QA REPORT — 2026-11-01 19:22 UTC
URL: https://mente-ten-iota.vercel.app | Activado por: CTO (checklist post-deploy) | Scope: módulo 1
Resultado: 4 OK | 0 P1 | 1 P0

### P0 — CRÍTICOS
#### [ ] Login roto en producción — anon key Supabase rechazada
- Flujo: login en /login con admin@mente.local (password leído de /tmp/opencode/mente-admin.txt, no impreso).
- Síntoma: el click "Entrar" no navega; página se queda en /login sin mensaje de error visible en la UI (también es un bug de feedback, P2).
- Capas: agent-browser (POST https://vgtbznppcthyitnzgmlt.supabase.co/auth/v1/token?grant_type=password → 400) + reproducción cURL directa → HTTP 401 {"message":"Invalid API key","hint":"Double check your Supabase `anon` or `service_role` API key."}
- Causa raíz: el NEXT_PUBLIC_SUPABASE_ANON_KEY horneado en el bundle prod (idéntico a .env.local; JWT ref vgtbznppcthyitnzgmlt, role anon, iat 2026-11-01 ~15:03 UTC) es RECHAZADO por Supabase. La clave es válida en parsing pero no reconocida por el backend de auth del proyecto (rotación/invalidación de claves legacy o JWT secret cambiado tras hornear). No es mismatch prod-vs-local: ambas usan la misma clave.
- Archivo: .env.local línea NEXT_PUBLIC_SUPABASE_ANON_KEY + re-secretize en Supabase Dashboard → Auth → API keys; luego re-build.
- Estado: Pendiente (no toco código; requiere clave nueva de David o regeneración en dashboard).

### PASADOS
- [1] Vercel READY: / → 307 a /login → 200, server: Vercel
- [2] Consola: 0 errores/warnings en /login
- [3] Excepciones: 0 (agent-browser errors vacío)
- [8] Headers: X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Referrer-Policy: strict-origin-when-cross-origin + HSTS + Permissions-Policy
- [6 parcial] /login cargó; vitals no medidos (shell no accesible)

### NO VERIFICADOS (bloqueados por P0 login)
- [4] API ideas POST 201/PUT/DELETE en flujo logueado — no ejecutable
- [5] React tree AppShell/BottomNav — no accesible sin sesión
- [6] Vitals del shell — no accesible
- [7] Datos reales: "primera idea en produccion" y link github — no ejecutable

### PENDIENTE DEL CTO (no mío)
- Docs se actualizarán hoy v2 (notas módulo).

### PENDIENTES PARA TROUBLESHOOTER
- [ ] Regenerar anon key válida (legacy o sb_publishable_) para vgtbznppcthyitnzgmlt y actualizar Vercel envs + rebuild
- [ ] Añadir mensaje de error visible en UI cuando signInWithPassword falla (nada en pantalla ahora)
