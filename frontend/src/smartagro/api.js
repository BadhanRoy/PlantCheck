const BASE = import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:8001/api';

const DEFAULT_TIMEOUT_MS = 60_000;
const CHAT_TIMEOUT_MS = 90_000;
const TTS_TIMEOUT_MS = 30_000;
const TRANSCRIBE_TIMEOUT_MS = 300_000;
const HEALTH_TIMEOUT_MS = 10_000;

async function parseError(response) {
  try {
    const data = await response.json();
    return data?.detail || `Request failed (${response.status}).`;
  } catch {
    return `Request failed (${response.status}).`;
  }
}

async function request(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${BASE}${url}`, {
      ...options,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(await parseError(response));
    return response;
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('The server took too long to respond. Please try again.');
    }
    if (err instanceof TypeError) {
      throw new Error('Could not reach the server. Check your connection.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function fetchHealth() {
  const res = await request('/health', {}, HEALTH_TIMEOUT_MS);
  return safeJson(res);
}

export async function transcribeAudio(blob, hintLanguage) {
  if (!blob || !blob.size || blob.size < 500) {
    throw new Error('No audio was captured. Please try again.');
  }
  const fd = new FormData();
  const ext = blob.type?.includes('mp4') ? 'mp4'
    : blob.type?.includes('ogg') ? 'ogg'
    : 'webm';
  fd.append('audio', blob, `recording.${ext}`);
  if (hintLanguage) fd.append('hint_language', hintLanguage);
  const res = await request(
    '/transcribe',
    { method: 'POST', body: fd },
    TRANSCRIBE_TIMEOUT_MS,
  );
  return safeJson(res);
}

export async function sendChat({ text, imageFile, history }) {
  const fd = new FormData();
  fd.append('text', text || '');
  fd.append('history_json', JSON.stringify(history || []));
  if (imageFile) fd.append('image', imageFile, imageFile.name);
  const res = await request('/chat', { method: 'POST', body: fd }, CHAT_TIMEOUT_MS);
  return safeJson(res);
}

export async function fetchTTS(text) {
  const res = await request(
    '/tts',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    },
    TTS_TIMEOUT_MS,
  );
  return res.blob();
}