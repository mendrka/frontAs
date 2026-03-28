import { API_URL } from '@config/runtime'

const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '')
const SPRECHEN_BASE = `${trimTrailingSlash(API_URL)}/sprechen`

const authHeader = () => {
  const token =
    (typeof window !== 'undefined' && (localStorage.getItem('eam_token') || localStorage.getItem('token'))) || ''
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const jsonHeaders = () => ({
  'Content-Type': 'application/json',
  ...authHeader(),
})

async function parseOrThrow(res, defaultMessage) {
  if (res.ok) return res.json().catch(() => ({}))
  const payload = await res.json().catch(() => ({}))
  throw new Error(payload?.message || payload?.error || defaultMessage || `Request failed (${res.status})`)
}

export const sendMessage = async (payload) => {
  const res = await fetch(`${SPRECHEN_BASE}/chat`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  })
  return parseOrThrow(res, 'Chat failed')
}

export const analyzeCorrection = async (payload) => {
  const res = await fetch(`${SPRECHEN_BASE}/correct`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  })
  return parseOrThrow(res, 'Correction failed')
}

export const requestHint = async (payload) => {
  const res = await fetch(`${SPRECHEN_BASE}/hint`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  })
  return parseOrThrow(res, 'Hint failed')
}

export const requestTTS = async (text, characterId) => {
  const res = await fetch(`${SPRECHEN_BASE}/tts`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ text, characterId }),
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error(payload?.message || payload?.error || 'TTS failed')
  }

  const contentType = res.headers.get('Content-Type') || ''
  if (contentType.includes('audio')) {
    const blob = await res.blob()
    return { type: 'blob', url: URL.createObjectURL(blob) }
  }

  const data = await res.json().catch(() => ({}))
  if (data.audioUrl) return { type: 'url', url: data.audioUrl }
  if (data.fallback) return { type: 'webspeech', text: data.text || text, voiceConfig: data.voiceConfig }
  throw new Error('TTS: unknown response format')
}

export const sendAudioForSTT = async (audioBlob) => {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'recording.webm')

  const res = await fetch(`${SPRECHEN_BASE}/stt`, {
    method: 'POST',
    headers: authHeader(),
    body: formData,
  })
  return parseOrThrow(res, 'STT failed')
}

export const startSession = async (payload) => {
  const res = await fetch(`${SPRECHEN_BASE}/session/start`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  })
  return parseOrThrow(res, 'Start session failed')
}

export const addTurn = async (sessionId, turn) => {
  const res = await fetch(`${SPRECHEN_BASE}/session/${encodeURIComponent(sessionId)}/turn`, {
    method: 'PATCH',
    headers: jsonHeaders(),
    body: JSON.stringify({ turn }),
  })
  if (!res.ok) throw new Error('Add turn failed')
}

export const endSession = async (sessionId) => {
  const res = await fetch(`${SPRECHEN_BASE}/session/${encodeURIComponent(sessionId)}/end`, {
    method: 'POST',
    headers: jsonHeaders(),
  })
  return parseOrThrow(res, 'End session failed')
}

export const captureWord = async (wordData) => {
  const res = await fetch(`${SPRECHEN_BASE}/vocabulary/capture`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(wordData),
  })
  if (!res.ok) throw new Error('Capture word failed')
}

export const getReviewWords = async () => {
  const res = await fetch(`${SPRECHEN_BASE}/vocabulary/review`, { headers: jsonHeaders() })
  return parseOrThrow(res, 'Review words failed')
}

export const getAnalytics = async () => {
  const res = await fetch(`${SPRECHEN_BASE}/analytics/overview`, { headers: jsonHeaders() })
  return parseOrThrow(res, 'Analytics failed')
}

export const getDNAHistory = async () => {
  const res = await fetch(`${SPRECHEN_BASE}/analytics/dna-history`, { headers: jsonHeaders() })
  return parseOrThrow(res, 'DNA history failed')
}

export const getDailyChallenge = async () => {
  const res = await fetch(`${SPRECHEN_BASE}/challenge/daily`, { headers: jsonHeaders() })
  return parseOrThrow(res, 'Daily challenge failed')
}

export const getBackgroundUrl = (themeBgKey) => {
  const prompts = {
    cafe: 'berlin cafe interior morning warm amber light bokeh dark moody cinematic',
    metro: 'berlin underground subway station neon blue light dark atmospheric cinematic',
    restaurant: 'german restaurant interior evening candlelight dark red elegant',
    office: 'modern berlin startup office night skyline dark blue cinematic',
    shop: 'boutique interior hamburg soft light minimalist fashion',
    classroom: 'language school berlin cozy morning light warm wooden desks',
  }
  const prompt = encodeURIComponent(prompts[themeBgKey] || prompts.cafe)
  return `https://image.pollinations.ai/prompt/${prompt}?width=1400&height=700&nologo=true&seed=${Date.now()}`
}
