/**
 * Abstraccion de providers AI (modulo 3): una sola surface chat()/chatStream
 * ()/transcribir() con credenciales explicitas por llamada. El chat intenta la
 * credencial recibida y cada respaldo en orden (403 region / 401 pasan al
 * siguiente); la transcripcion usa Whisper (OpenAI) y cae a OpenRouter con
 * modelo audio-capable. NI una key ni el contenido se loguean.
 */

export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string };

export type ProveedorIa = 'openrouter' | 'openai';

const OPENAI_BASE = 'https://api.openai.com/v1';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const MODELO_BASE = 'gpt-4o-mini';
const MODELO_OPENROUTER = 'openai/gpt-4o-mini'; /* mismo modelo, su prefijo */
const MODELO_AUDIO_OPENROUTER = 'openai/gpt-4o-audio-preview';
const CAP_AUDIO = 25 * 1_048_576; /* 25MB: contracto de transcription */

/* mensaje unico para el usuario final cuando no hay provider disponible
 * (sin clave configurada o proveedor bloqueado); NUNCA expone key ni region */
export const MENSAJE_AI_INDISPONIBLE =
  'La AI no esta disponible: configura tu clave en Ajustes.';

export function errorAiIndisponible(): Error {
  return new Error(MENSAJE_AI_INDISPONIBLE);
}

export type Credencial = {
  baseUrl: string;
  apiKey: string;
  modelo: string;
  proveedor: ProveedorIa;
};

/** credencial canonica de un proveedor con la key indicada */
export function credencialDeProveedor(proveedor: ProveedorIa, apiKey: string): Credencial {
  return proveedor === 'openai'
    ? { baseUrl: OPENAI_BASE, apiKey, modelo: MODELO_BASE, proveedor }
    : { baseUrl: OPENROUTER_BASE, apiKey, modelo: MODELO_OPENROUTER, proveedor };
}

/** credenciales de entorno en orden de intento: OpenRouter primero
 * (region-safe), OpenAI respaldo. Fallback de desarrollo. Ninguna key
 * devuelta debe loguearse. */
export function credencialesDeEntorno(): Credencial[] {
  const lista: Credencial[] = [];
  const openrouter = process.env.OPENROUTER_API_KEY?.trim();
  if (openrouter) lista.push(credencialDeProveedor('openrouter', openrouter));
  const openai = process.env.OPENAI_API_KEY?.trim();
  if (openai) lista.push(credencialDeProveedor('openai', openai));
  return lista;
}

/** chat completo: intenta cada credencial en orden y devuelve el primer
 * choice. Sin credenciales o todas fallando -> errorAiIndisponible (503 para
 * el usuario, sin detalles). */
export async function chat(
  mensajes: ChatMsg[],
  credenciales: Credencial[],
  maxTokens = 800
): Promise<string | null> {
  if (credenciales.length === 0) throw errorAiIndisponible();
  for (const cred of credenciales) {
    let res: Response;
    try {
      res = await fetch(`${cred.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cred.apiKey}` },
        body: JSON.stringify({ model: cred.modelo, messages: mensajes, max_tokens: maxTokens, temperature: 0.4 }),
        signal: AbortSignal.timeout(30000)
      });
    } catch {
      continue; /* red/timeout: prueba la siguiente credencial */
    }
    if (!res.ok) {
      if (res.status === 403) console.error('region blocked'); /* nunca la key */
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
  credenciales: Credencial[],
  maxTokens = 900
): Promise<Response | null> {
  if (credenciales.length === 0) return null;
  for (const cred of credenciales) {
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

/** transcripcion: Whisper solo si hay credencial OpenAI; si no, audio-capable
 * de OpenRouter solo si hay credencial OpenRouter; si no hay ninguna ->
 * errorAiIndisponible (503 para el usuario). */
export async function transcribir(
  audio: ArrayBuffer,
  nombre: string,
  credenciales: Credencial[]
): Promise<string> {
  if (audio.byteLength > CAP_AUDIO) throw new Error('_demasiado_grande');
  const openai = credenciales.find((c) => c.proveedor === 'openai');
  if (openai) {
    const form = new FormData();
    form.set('file', new Blob([audio]), nombre);
    form.set('model', 'whisper-1');
    const res = await fetch(`${openai.baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${openai.apiKey}` },
      body: form
    });
    if (res.ok) {
      const json = (await res.json()) as { text?: string };
      return json.text ?? '';
    }
    if (res.status === 403) console.error('region blocked'); /* nunca la key */
  }
  const openrouter = credenciales.find((c) => c.proveedor === 'openrouter');
  if (!openrouter) throw errorAiIndisponible();
  return await transcribirOpenRouter(audio, nombre, openrouter);
}

/** fallback audio-capable: chat multimodal de OpenRouter con input_audio */
async function transcribirOpenRouter(
  audio: ArrayBuffer,
  nombre: string,
  cred: Credencial
): Promise<string> {
  const ext = nombre.split('.').pop()?.toLowerCase() ?? '';
  const formato = ['mp3', 'wav', 'm4a', 'ogg', 'webm', 'flac'].includes(ext) ? ext : 'webm';
  const base64 = Buffer.from(audio).toString('base64');
  const res = await fetch(`${cred.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cred.apiKey}` },
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

/** valida una key contra el endpoint autenticado del proveedor. OpenAI
 * /models y OpenRouter /key responden 401 sin key valida (OpenRouter /models
 * es publico y no permite validar). 200 -> ok; 401/403 -> invalida; red, 5xx o
 * timeout -> red. Nunca loguea la clave. */
export async function validarClave(
  proveedor: ProveedorIa,
  apiKey: string
): Promise<{ ok: true } | { ok: false; motivo: 'invalida' | 'red' }> {
  const cred = credencialDeProveedor(proveedor, apiKey);
  const ruta = proveedor === 'openai' ? '/models' : '/key';
  try {
    const res = await fetch(`${cred.baseUrl}${ruta}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000)
    });
    if (res.ok) return { ok: true };
    if (res.status === 401 || res.status === 403) return { ok: false, motivo: 'invalida' };
    return { ok: false, motivo: 'red' };
  } catch {
    return { ok: false, motivo: 'red' };
  }
}
