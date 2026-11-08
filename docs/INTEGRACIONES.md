# Integraciones y MCP — documentacion publica v1

> Espejo del repo de la pagina https://mente-ten-iota.vercel.app/integraciones
> (mismo contenido). Fuente de las 9 herramientas: `src/lib/mcp/tools.ts`.
> Ultima revision: modulo 19 (2026-11-08).

Documentacion abierta v1: cualquier herramienta externa con AI puede entrar y
trabajar con tu Mente. Lectura, creacion y cierre de tareas; nada destructivo.

## 1. Como se autoriza un conector

Mente expone un servidor MCP por HTTP en `https://mente-ten-iota.vercel.app/api/mcp`.
Hay dos formas de autorizar tu herramienta:

1. **Bearer token**: en Mente, /ajustes, seccion Acceso para agentes →
   "Añadir conector". Obtienes un token `mt_` de una sola vista; la cabecera
   es `Authorization: Bearer mt_XXX` en cada llamada.
2. **Device flow (CLI)**: `/api/mcp-login/start` crea una solicitud; el dueno
   la aprueba en `/conectar` dentro de su sesion; tu CLI hace poll a
   `/api/mcp-login/poll` y recibe el token UNA vez.

```bash
curl -s -X POST https://mente-ten-iota.vercel.app/api/mcp-login/start \
  -H 'Content-Type: application/json' -d '{"nombre":"opencode"}'
# -> {"device_code":"dc_...","url":".../conectar?device=dc_...","expira_en":900}
# el dueno abre esa url con su sesion y aprueba o rechaza

curl -s -X POST https://mente-ten-iota.vercel.app/api/mcp-login/poll \
  -H 'Content-Type: application/json' -d '{"device_code":"dc_..."}'
# pendiente -> {"estado":"pendiente"} · aprobado -> {"estado":"granted","token":"mt_..."} una sola vez
```

## 2. Herramientas (v1: 9)

Todas leen o escriben dentro del proyecto del dueno del token (`user_id`
derivado del token). Limites: tareas 50 por respuesta, paginas 20,
subpaginas 10, texto 2000 chars, titulo 200 chars.

| Herramienta | Que hace | Argumentos requeridos |
|---|---|---|
| buscar_tareas | Devuelve hasta 50 tareas pendientes del usuario ordenadas por fecha. | ninguno |
| obtener_plan | Devuelve el plan del proyecto: paginas (titulo + contenido, max 20) y tareas pendientes. | proyecto |
| leer_investigacion | Devuelve hasta 10 investigaciones del proyecto como texto plano (raiz + subpaginas). | proyecto |
| crear_nota | Crea una nota de texto dentro del proyecto (estado proyecto, max 2000 chars). | proyecto, texto |
| crear_subpagina | Crea una subpagina hija de una pagina existente del proyecto (max profundidad 3). | proyecto, pagina_titulo, texto |
| crear_tarea | Crea una tarea pendiente en el proyecto (titulo max 200 chars). | proyecto, titulo |
| terminar_tarea | Marca la tarea como hecha y, si hay resultado, lo deja como nota del proyecto. | id |
| importar_investigacion | Importa una investigacion: raiz + hasta 10 subpaginas hijas (max 2000 chars cada una). | proyecto, titulo, cuerpo |
| pedir_anexo | Pide algo a David: nota en la bandeja con la marca del worker. | mensaje |

## 3. Config JSON de ejemplo

Sirve para opencode o para cualquier cliente MCP que acepte servidores HTTP
(url + cabecera Authorization). Cambia `mt_TU_TOKEN_DE_CONECTOR` por tu token.

```json
{
  "mcpServers": {
    "mente": {
      "type": "http",
      "url": "https://mente-ten-iota.vercel.app/api/mcp",
      "headers": { "Authorization": "Bearer mt_TU_TOKEN_DE_CONECTOR" }
    }
  }
}
```

**Muse y Grok sin MCP**: si tu asistente no soporta MCP, no hace falta
extenderlo aqui: usa Copiar recado por tarea en Mente, que deja el contexto
listo en el formato correcto para cada uno. Si soporta cliente MCP por HTTP,
con la config de arriba entra directo.

## 4. Permisos por conector

Cada conector decide que herramientas le permites. En /ajustes, seccion
Acceso para agentes, expande el token: veras las 9 herramientas con un
interruptor cada una, mas acciones rapidas Todas/Ninguna. Guardado por
cambio; lista vacia bloquea TODO. El servidor tambien cumple: `tools/list`
solo ofrece lo permitido y `tools/call` rechaza lo demas (error -32002,
queda logeado como accion 'bloqueada').

## 5. Seguridad

- Tokens revocables en /ajustes (se borra el hash, no quedan copias).
- En base de datos solo vive el SHA-256 del token, jamas el token plano.
- Log auditable por accion (token_acciones) sin contenido sensible.
- Rate limit: 60 peticiones por minuto por token.
- Nada destructivo: lo mas fuerte es terminar_tarea (marca hecha).
- El user_id vive en el token: un conector nunca ve datos de otro usuario.

## 6. Limites v1

- Sin notificaciones push hacia los conectores: son los conectores los que
  preguntan.
- Sin busquedas de texto libre: las herramientas trabajan por proyecto,
  tarea e id.
- Sin streaming: respuestas JSON-RPC 2.0 stateless por HTTP.

Bugs o ideas: repo de Mente en GitHub (https://github.com/servdavid001-ctrl/mente).
