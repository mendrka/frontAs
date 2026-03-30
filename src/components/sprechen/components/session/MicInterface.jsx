import { useEffect, useRef, useState } from 'react'
import { Mic, Send, Square } from 'lucide-react'
import { useSessionStore } from '../../stores/sessionStore'

const ERROR_COPY = {
  microphone_denied: 'Acces micro refuse.',
  microphone_not_found: 'Aucun microphone detecte.',
  microphone_not_supported: 'Le navigateur ne supporte pas cet enregistrement.',
  microphone_error: 'Erreur micro.',
}

export default function MicInterface({ speech, onSubmit, onMicRelease }) {
  const [textFallback, setTextFallback] = useState('')
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [liveFading, setLiveFading] = useState(false)
  const [isSubmittingMic, setIsSubmittingMic] = useState(false)
  const liveTranscriptRef = useRef('')
  const { startRecording, stopRecording, cancelRecording, support, isSupported } = speech
  const {
    liveTranscript,
    micState,
    isAiSpeaking,
    isAiThinking,
    errorMessage,
    setLiveTranscript,
    setIsUserSpeaking,
    setErrorMessage,
    setMicState,
  } = useSessionStore()

  useEffect(() => {
    liveTranscriptRef.current = liveTranscript
  }, [liveTranscript])

  useEffect(() => {
    setLiveTranscript('')
    return () => {
      cancelRecording?.()
    }
  }, [cancelRecording, setLiveTranscript])

  const busy = isAiSpeaking || isAiThinking || micState === 'processing'

  const startCapture = async () => {
    setErrorMessage(null)
    setMicState('recording')
    setIsUserSpeaking(true)
    setLiveFading(false)

    const started = await startRecording({
      onInterim: (text) => setLiveTranscript(text),
      onVolumeLevel: (level) => setVolumeLevel(level),
      onError: (code) => {
        setErrorMessage(ERROR_COPY[code] || ERROR_COPY.microphone_error)
        setMicState('idle')
        setIsUserSpeaking(false)
        setVolumeLevel(0)
      },
    })

    if (!started) {
      setMicState('idle')
      setIsUserSpeaking(false)
    }
  }

  const stopCapture = async () => {
    if (isSubmittingMic) return
    setIsSubmittingMic(true)
    setIsUserSpeaking(false)
    setLiveFading(true)
    setVolumeLevel(0)
    try {
      await onMicRelease({ stopRecording, liveTranscriptRef })
    } finally {
      window.setTimeout(() => setLiveFading(false), 300)
      setIsSubmittingMic(false)
    }
  }

  const handleTextSubmit = async () => {
    const value = textFallback.trim()
    if (!value || busy) return
    setTextFallback('')
    await onSubmit(value, { responseTimeMs: 0 })
  }

  const liveTranscriptClass = `sp-live-transcript ${micState === 'recording' ? 'active' : ''} ${liveFading ? 'fading-out' : ''}`.trim()
  const buttonState = micState === 'processing' ? 'processing' : micState === 'recording' ? 'recording' : 'idle'

  return (
    <>
      <div className={liveTranscriptClass}>
        {micState === 'processing' ? 'Analyse...' : liveTranscript || 'Parle en allemand quand le micro est actif.'}
      </div>

      {(typeof isSupported === 'boolean' ? isSupported : support?.stt) ? (
        <div className="sp-mic-row">
          <button
            type="button"
            className={`sp-mic-btn ${buttonState}`}
            disabled={(busy && micState !== 'recording') || isSubmittingMic}
            onClick={() => {
              if (micState === 'idle') startCapture()
              else if (micState === 'recording') stopCapture()
            }}
          >
            {micState === 'recording' ? <Square size={22} /> : <Mic size={22} />}
          </button>

          <div className="sp-waveform">
            {Array.from({ length: 20 }).map((_, index) => {
              const active = micState === 'recording'
              const height = active ? Math.max(4, Math.min(36, (volumeLevel / 100) * (18 + (index % 5) * 4))) : 4
              return <span key={`bar-${index}`} className={`sp-waveform-bar ${active ? 'active' : ''}`} style={{ height }} />
            })}
          </div>
        </div>
      ) : (
        <div className="sp-mic-row">
          <input
            className="sp-text-input-fallback"
            value={textFallback}
            onChange={(event) => setTextFallback(event.target.value)}
            placeholder="Schreibe deine Antwort auf Deutsch..."
          />
          <button type="button" className="sp-send-btn" onClick={handleTextSubmit} disabled={busy}>
            <Send size={16} />
          </button>
        </div>
      )}

      {errorMessage && <div className="sp-mic-error">{errorMessage}</div>}
    </>
  )
}
