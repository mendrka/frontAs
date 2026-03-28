let recognitionInstance = null
let ttsWatchdog = null
let visibilityHandlerInstalled = false

export function checkSpeechSupport() {
  return {
    stt:
      typeof window !== 'undefined' &&
      ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window),
    tts: typeof window !== 'undefined' && 'speechSynthesis' in window,
  }
}

export function getGermanVoice() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null

  const voices = window.speechSynthesis.getVoices()
  const preferred = voices.find((voice) => voice.lang === 'de-DE' && voice.name.includes('Google'))
  const exact = voices.find((voice) => voice.lang === 'de-DE')
  const anyGerman = voices.find((voice) => voice.lang.startsWith('de'))

  return preferred || exact || anyGerman || null
}

function ensureVisibilityHandler() {
  if (visibilityHandlerInstalled || typeof document === 'undefined' || typeof window === 'undefined') return

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.speechSynthesis?.paused) {
      window.speechSynthesis.resume()
    }
  })

  visibilityHandlerInstalled = true
}

export function loadVoices(onReady) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return () => {}

  ensureVisibilityHandler()

  const emit = () => onReady?.(getGermanVoice())
  emit()
  window.speechSynthesis.addEventListener('voiceschanged', emit)
  return () => window.speechSynthesis.removeEventListener('voiceschanged', emit)
}

export function speak(text, options = {}) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) {
      resolve()
      return
    }

    ensureVisibilityHandler()
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    const germanVoice = getGermanVoice()
    if (germanVoice) utterance.voice = germanVoice

    utterance.lang = germanVoice?.lang || 'de-DE'
    utterance.rate = options.rate || 0.92
    utterance.pitch = options.pitch || 1
    utterance.volume = 1

    utterance.onend = () => {
      clearInterval(ttsWatchdog)
      resolve()
    }

    utterance.onerror = () => {
      clearInterval(ttsWatchdog)
      resolve()
    }

    ttsWatchdog = window.setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause()
        window.speechSynthesis.resume()
      }
    }, 10000)

    window.speechSynthesis.speak(utterance)
  })
}

export function stopSpeaking() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  clearInterval(ttsWatchdog)
  window.speechSynthesis.cancel()
}

export function startListening({
  onInterim,
  onFinal,
  onError,
  onSilence,
  onHesitation,
  lang = 'de-DE',
}) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

  if (!SpeechRecognition) {
    onError?.('not_supported')
    return null
  }

  const recognition = new SpeechRecognition()
  let silenceTimer = null
  let accumulated = ''
  let lastSpeechAt = 0
  let flushed = false

  const flushFinal = () => {
    if (flushed) return
    const finalText = accumulated.trim()
    if (!finalText) return
    flushed = true
    onFinal?.(finalText)
  }

  recognition.lang = lang
  recognition.continuous = true
  recognition.interimResults = true
  recognition.maxAlternatives = 1

  recognition.onresult = (event) => {
    clearTimeout(silenceTimer)

    let interim = ''
    let hasFinalChunk = false

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index]
      const transcript = result[0]?.transcript || ''

      if (result.isFinal) {
        accumulated += `${transcript.trim()} `
        hasFinalChunk = true
      } else {
        interim += transcript
      }
    }

    const now = Date.now()
    if (lastSpeechAt && now - lastSpeechAt > 800) {
      onHesitation?.()
    }
    lastSpeechAt = now

    onInterim?.(`${accumulated}${interim}`.trim())

    silenceTimer = window.setTimeout(() => {
      if (!hasFinalChunk && !accumulated.trim()) return
      flushFinal()
      onSilence?.()
      recognition.stop()
    }, 2000)
  }

  recognition.onerror = (event) => {
    if (event.error === 'no-speech') return
    onError?.(event.error)
  }

  recognition.onend = () => {
    clearTimeout(silenceTimer)
    flushFinal()
  }

  recognition.start()
  recognitionInstance = recognition
  return recognition
}

export function stopListening() {
  if (!recognitionInstance) return
  recognitionInstance.stop()
  recognitionInstance = null
}

export async function startAudioMeter(onLevel) {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return null
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  const audioContext = new AudioContextClass()
  const analyser = audioContext.createAnalyser()
  const source = audioContext.createMediaStreamSource(stream)
  const data = new Uint8Array(analyser.frequencyBinCount)
  let animationFrameId = 0

  analyser.fftSize = 256
  analyser.smoothingTimeConstant = 0.85
  source.connect(analyser)

  const loop = () => {
    analyser.getByteTimeDomainData(data)

    let total = 0
    for (let index = 0; index < data.length; index += 1) {
      const normalized = (data[index] - 128) / 128
      total += normalized * normalized
    }

    onLevel?.(Math.min(Math.sqrt(total / data.length) * 4, 1))
    animationFrameId = window.requestAnimationFrame(loop)
  }

  loop()

  return async () => {
    window.cancelAnimationFrame(animationFrameId)
    source.disconnect()
    analyser.disconnect()
    stream.getTracks().forEach((track) => track.stop())
    await audioContext.close()
  }
}

export function isSTTAvailable() {
  return checkSpeechSupport().stt
}

export function isTTSAvailable() {
  return checkSpeechSupport().tts && Boolean(getGermanVoice())
}
