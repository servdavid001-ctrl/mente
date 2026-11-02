/**
 * Abstraccion de providers AI (modulo 3): una sola surface chat()/transcribir()
 * con OPENAI (preferente para transcripcion: whisper) y OPENROUTER (fallback
 * del chat completo). NI una key ni el contenido se loguean (audit: sin fuga).
 */

export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string };

const OPENAI_BASE = 'https://api.openai.com/v1';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const MODELO_BASE = 'gpt-4o-mini';
const MODELO_OPENROUTER = 'openai/gpt-4o-mini'; /* mismo modelo, su prefijo */

/** credenciales activas para chat: OpenAI tiene precedencia, OpenRouter respaldo */
export function chatCredenciales(): { baseUrl: string; apiKey: string; modelo: string } | null {
  const openai = process.env.OPENAI_API_KEY?.trim();
  if (openai) return { baseUrl: OPENAI_BASE, apiKey: openai, modelo: MODELO_BASE };
  const openrouter = process.env.OPENROUTER_API_KEY?.trim();
  if (openrouter) return { baseUrl: OPENROUTER_BASE, apiKey: openrouter, modelo: MODELO_OPENROUTER };
  return null;
}

/** chat completo: devuelve el texto del primer choice; null si no hay provider */
export async function chat(mensajes: ChatMsg[], maxTokens = 800): Promise<string | null> {
  const cred = chatCredenciales();
  if (!cred) return null;
  const res = await fetch(`${cred.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cred.apiKey}` },
    body: JSON.stringify({ model: cred.modelo, messages: mensajes, max_tokens: maxTokens, temperature: 0.4 })
  });
  if (!res.ok) throw new Error(`AI-${res.status}`);
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? null;
}

/** chat en streaming: devuelve la Response cruda para passthrough (SSE); null sin provider */
export async function chatStream(
  mensajes: ChatMsg[],
  maxTokens = 900
): Promise<Response | null> {
  const cred = chatCredenciales();
  if (!cred) return null;
  return fetch(`${cred.baseUrl}/chat/completions`, {
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
