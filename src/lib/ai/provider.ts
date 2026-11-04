/**
 * Abstraccion de providers AI (modulo 3): una sola surface chat()/chatStream
 *()/transcribir(). El chat intenta OPENAI primero y OPENROUTER de respaldo en
 * cascada (region 403 / 401 pasan al siguiente); la transcripcion solo OpenAI
 * (whisper). NI una key ni el contenido se loguean (audit: sin fuga).
 */

export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string };

const OPENAI_BASE = 'https://api.openai.com/v1';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const MODELO_BASE = 'gpt-4o-mini';
const MODELO_OPENROUTER = 'openai/gpt-4o-mini'; /* mismo modelo, su prefijo */

export type Credencial = { baseUrl: string; apiKey: string; modelo: string };

/** credenciales en orden de intento: OpenAI primero, OpenRouter respaldo.
 * ninguna key devuelta debe loguearse (audit: sin fuga). */
export function credencialesChat(): Credencial[] {
  const lista: Credencial[] = [];
  const openai = process.env.OPENAI_API_KEY?.trim();
  if (openai) lista.push({ baseUrl: OPENAI_BASE, apiKey: openai, modelo: MODELO_BASE });
  const openrouter = process.env.OPENROUTER_API_KEY?.trim();
  if (openrouter)
    lista.push({ baseUrl: OPENROUTER_BASE, apiKey: openrouter, modelo: MODELO_OPENROUTER });
  return lista;
}

/** chat completo: intenta cada credencial en orden (OpenAI 401/403 region
 * pasan al respaldo OpenRouter antes de morir) y devuelve el primer choice */
export async function chat(mensajes: ChatMsg[], maxTokens = 800): Promise<string | null> {
  const cands = credencialesChat();
  if (cands.length === 0) return null;
  let ultimoFallo: Error = new Error('AI-500');
  for (const cred of cands) {
    const res = await fetch(`${cred.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cred.apiKey}` },
      body: JSON.stringify({ model: cred.modelo, messages: mensajes, max_tokens: maxTokens, temperature: 0.4 })
    });
    if (!res.ok) {
      ultimoFallo = new Error(`AI-${res.status}`);
      continue;
    }
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const texto = json.choices?.[0]?.message?.content;
    if (texto !== undefined) return texto;
  }
  throw ultimoFallo;
}

/** chat en streaming: passthrough SSE; intenta las credenciales en orden y
 * devuelve la primera respuesta 2xx (null = sin provider o todas fallaron,
 * el contracto del caller queda 502 "Tu AI no respondio. Reintentar") */
export async function chatStream(
  mensajes: ChatMsg[],
  maxTokens = 900
): Promise<Response | null> {
  const cands = credencialesChat();
  if (cands.length === 0) return null;
  for (const cred of cands) {
    const res = await fetch(`${cred.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cred.apiKey}` },
      body: JSON.stringify({
        model: cred.modelo,
        messages: mensajes,
        max_tokens: maxTokens,
        temperature: 0.6,
        stream: true
      })
    });
    if (res.ok && res.body) return res;
  }
  return null;
}

/** transcripcion Whisper-1 (endpoint audio/transcriptions multipart).
 * null = falta key OpenAI (la copia del caller dice que falta, con 409). */
export async function transcribir(
  audio: ArrayBuffer,
  nombre: string
): Promise<string | null> {
  const openai = process.env.OPENAI_API_KEY?.trim();
  if (!openai) return null;
  const form = new FormData();
  form.set('file', new Blob([audio]), nombre);
  form.set('model', 'whisper-1');
  const res = await fetch(`${OPENAI_BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${openai}` },
    body: form
  });
  if (!res.ok) throw new Error(`AI-${res.status}`);
  const json = (await res.json()) as { text?: string };
  return json.text ?? '';
}

/** firma de error por provider ausente (reservada para el contracto 409) */
export function errorSinTranscripcion(): Error {
  return new Error('La transcripcion requiere una key de OpenAI');
}
