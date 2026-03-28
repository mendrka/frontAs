import { useCallback, useRef } from 'react'
import { requestTTS } from '../services/sprechenAPI'

export const useAudio = () => {
  const audioRef = useRef(null)
  const ttsWatchdog = useRef(null)

  const stopAudio = useCallback(() => {
    clearInterval(ttsWatchdog.current)
    ttsWatchdog.current = null
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }, [])

  const speakWithWebSpeech = useCallback((text, voiceConfig) => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve()
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      const voices = window.speechSynthesis.getVoices()
      const germanVoice =
        voices.find((voice) => voice.lang === 'de-DE' && voice.name.includes('Google')) ||
        voices.find((voice) => voice.lang === 'de-DE') ||
        voices.find((voice) => voice.lang?.startsWith('de'))

      if (germanVoice) utterance.voice = germanVoice
      utterance.lang = voiceConfig?.lang || 'de-DE'
      utterance.rate = voiceConfig?.rate ?? 0.9
      utterance.pitch = voiceConfig?.pitch ?? 1.0

      ttsWatchdog.current = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause()
          window.speechSynthesis.resume()
        }
      }, 10000)

      utterance.onend = () => {
        clearInterval(ttsWatchdog.current)
        resolve()
      }
      utterance.onerror = () => {
        clearInterval(ttsWatchdog.current)
        resolve()
      }

      window.speechSynthesis.speak(utterance)
    })
  }, [])

  const speakText = useCallback(
    async (text, characterId) => {
      stopAudio()

      try {
        const result = await requestTTS(text, characterId)

        if (result.type === 'blob' || result.type === 'url') {
          return new Promise((resolve) => {
            const audio = new Audio(result.url)
            audioRef.current = audio
            audio.onended = () => resolve()
            audio.onerror = () => resolve()
            audio.play().catch(() => resolve())
          })
        }

        if (result.type === 'webspeech') {
          return speakWithWebSpeech(result.text, result.voiceConfig)
        }
      } catch {
        return speakWithWebSpeech(text, { lang: 'de-DE', rate: 0.9 })
      }
    },
    [speakWithWebSpeech, stopAudio]
  )

  return { speakText, stopAudio }
}

