/**
 * Abstraccion de providers AI (modulo 3): una sola surface chat()/chatStream
 *()/transcribir(). El chat intenta OPENROUTER primero (region-safe) y OPENAI
 * de respaldo (403 region / 401 pasan al siguiente); la transcripcion usa
 * Whisper y cae a OpenRouter con modelo audio-capable. NI una key ni el
 * contenido se loguean (audit: sin fuga; logs solo 'region blocked').
 */

export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string };

const OPENAI_BASE = 'https://api.openai.com/v1';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const MODELO_BASE = 'gpt-4o-mini';
const MODELO_OPENROUTER = 'openai/gpt-4o-mini'; /* mismo modelo, su prefijo */
const MODELO_AUDIO_OPENROUTER = 'openai/gpt-4o-audio-preview';
const CAP_AUDIO = 25 * 1_048_576; /* 25MB: contracto de transcription */

/* mensaje unico para el usuario final cuando no hay provider disponible
 * (sin keys o ambas region-blocked); NUNCA expone key ni region en body */
export const MENSAJE_AI_INDISPONIBLE =
  'La AI no esta disponible todavia: agrega tu OPENROUTER_API_KEY en el panel de config';

export function errorAiIndisponible(): Error {
  return new Error(MENSAJE_AI_INDISPONIBLE);
}

export type Credencial = { baseUrl: string; apiKey: string; modelo: string };

/** credenciales en orden de intento: OpenRouter primero (region-safe), OpenAI
 * respaldo. ninguna key devuelta debe loguearse (audit: sin fuga). */
export function credencialesChat(): Credencial[] {
  const lista: Credencial[] = [];
  const openrouter = process.env.OPENROUTER_API_KEY?.trim();
  if (openrouter)
    lista.push({ baseUrl: OPENROUTER_BASE, apiKey: openrouter, modelo: MODELO_OPENROUTER });
  const openai = process.env.OPENAI_API_KEY?.trim();
  if (openai) lista.push({ baseUrl: OPENAI_BASE, apiKey: openai, modelo: MODELO_BASE });
  return lista;
}

/** chat completo: intenta cada credencial en orden (OpenRouter primero; 401/403
 * region pasan al respaldo) y devuelve el primer choice. Sin keys o todas
 * fallando -> errorAiIndisponible (503 para el usuario, sin detalles). */
export async function chat(mensajes: ChatMsg[], maxTokens = 800): Promise<string | null> {
  const cands = credencialesChat();
  if (cands.length === 0) throw errorAiIndisponible();
  let ultimoFallo: Error = new Error('AI-500');
  for (const cred of cands) {
    const res = await fetch(`${cred.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cred.apiKey}` },
      body: JSON.stringify({ model: cred.modelo, messages: mensajes, max_tokens: maxTokens, temperature: 0.4 })
    });
    if (!res.ok) {
      if (res.status === 403) console.error('region blocked'); /* nunca la key */
      ultimoFallo = new Error(`AI-${res.status}`);
      continue;
    }
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const texto = json.choices?.[0]?.message?.content;
    if (texto !== undefined) return texto;
  }
  throw errorAiIndisponible();
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

/** transcripcion: Whisper (OpenAI) y, si falta key o la region la bloquea
 * (403 -> log solo 'region blocked'), cae a OpenRouter con modelo audio-capable
 * enviando el audio como input_audio base64 (cap 25MB). Sin OpenRouter key o
 * region-blocked tambien -> errorAiIndisponible (503 para el usuario). */
export async function transcribir(
  audio: ArrayBuffer,
  nombre: string
): Promise<string> {
  if (audio.byteLength > CAP_AUDIO) throw new Error('_demasiado_grande');
  const openai = process.env.OPENAI_API_KEY?.trim();
  if (openai) {
    const form = new FormData();
    form.set('file', new Blob([audio]), nombre);
    form.set('model', 'whisper-1');
    const res = await fetch(`${OPENAI_BASE}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${openai}` },
      body: form
    });
    if (res.ok) {
      const json = (await res.json()) as { text?: string };
      return json.text ?? '';
    }
    if (res.status === 403) console.error('region blocked'); /* nunca la key */
  }
  return await transcribirOpenRouter(audio, nombre);
}

/** fallback audio-capable: chat multimodal de OpenRouter con input_audio */
async function transcribirOpenRouter(audio: ArrayBuffer, nombre: string): Promise<string> {
  const openrouter = process.env.OPENROUTER_API_KEY?.trim();
  if (!openrouter) throw errorAiIndisponible();
  const ext = nombre.split('.').pop()?.toLowerCase() ?? '';
  const formato = ['mp3', 'wav', 'm4a', 'ogg', 'webm', 'flac'].includes(ext) ? ext : 'webm';
  const base64 = Buffer.from(audio).toString('base64');
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openrouter}` },
    body: JSON.stringify({
      model: MODELO_AUDIO_OPENROUTER,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Transcribe el audio de forma literal, sin comentarios ni '
                + 'marcadores. Devuelve unicamente la transcripcion en texto plano.'
            },
            { type: 'input_audio', input_audio: { data: base64, format: formato } }
          ]
        }
      ]
    })
  });
  if (!res.ok) {
    if (res.status === 403) console.error('region blocked'); /* nunca la key */
    throw errorAiIndisponible();
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content?.trim() ?? '';
}
