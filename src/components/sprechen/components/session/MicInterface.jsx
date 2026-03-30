import { useEffect, useRef, useState } from 'react'
import { Mic, Pencil, RotateCcw, Send, Square } from 'lucide-react'
import { useSessionStore } from '../../stores/sessionStore'

const ERROR_COPY = {
  microphone_denied: 'Acces micro refuse.',
  microphone_not_found: 'Aucun microphone detecte.',
  microphone_not_supported: 'Le navigateur ne supporte pas cet enregistrement.',
  microphone_error: 'Erreur micro.',
}

export default function MicInterface({ speech, onSubmit, onMicRelease }) {
  const [textFallback, setTextFallback] = useState('')
  const [draftTranscript, setDraftTranscript] = useState('')
  const [isEditingDraft, setIsEditingDraft] = useState(false)
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
    setFinalTranscript,
    setIsUserSpeaking,
    setErrorMessage,
    setMicState,
  } = useSessionStore()

  useEffect(() => {
    liveTranscriptRef.current = liveTranscript
    if (!isEditingDraft) {
      setDraftTranscript(liveTranscript)
    }
  }, [isEditingDraft, liveTranscript])

  useEffect(() => {
    if (micState === 'recording') {
      setIsEditingDraft(false)
    }
  }, [micState])

  useEffect(() => {
    setLiveTranscript('')
    return () => {
      cancelRecording?.()
    }
  }, [cancelRecording, setLiveTranscript])

  const busy = isAiSpeaking || isAiThinking || micState === 'processing'

  const startCapture = async () => {
    setErrorMessage(null)
    setLiveTranscript('')
    setFinalTranscript('')
    setDraftTranscript('')
    setIsEditingDraft(false)
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

  const stopCapture = async ({ submit = false } = {}) => {
    if (isSubmittingMic) return
    setIsSubmittingMic(true)
    setIsUserSpeaking(false)
    setVolumeLevel(0)
    try {
      if (submit) {
        setLiveFading(true)
      }
      await onMicRelease({ stopRecording, liveTranscriptRef, submit })
    } finally {
      if (submit) {
        window.setTimeout(() => setLiveFading(false), 300)
      }
      setIsSubmittingMic(false)
    }
  }

  const handleTextSubmit = async () => {
    const value = textFallback.trim()
    if (!value || busy) return
    setTextFallback('')
    await onSubmit(value, { responseTimeMs: 0 })
  }

  const handleSend = async () => {
    if (busy || isSubmittingMic) return

    if (micState === 'recording') {
      await stopCapture({ submit: true })
      return
    }

    const transcript = (isEditingDraft ? draftTranscript : liveTranscriptRef.current).trim()
    if (!transcript) return

    setLiveFading(true)
    try {
      await onSubmit(transcript, { responseTimeMs: 0 })
      setLiveTranscript('')
      setFinalTranscript('')
      setDraftTranscript('')
      setIsEditingDraft(false)
    } catch {
      setDraftTranscript(transcript)
      setLiveTranscript(transcript)
      setFinalTranscript(transcript)
      setIsEditingDraft(true)
      setMicState('done')
    } finally {
      window.setTimeout(() => setLiveFading(false), 300)
    }
  }

  const handleReset = async () => {
    if (busy || isSubmittingMic) return

    if (micState === 'recording') {
      await cancelRecording?.()
    }

    setLiveFading(false)
    setVolumeLevel(0)
    setLiveTranscript('')
    setFinalTranscript('')
    setDraftTranscript('')
    setIsEditingDraft(false)
    setIsUserSpeaking(false)
    setErrorMessage(null)
    setMicState('idle')
  }

  const handleDraftEdit = async () => {
    if (busy || isSubmittingMic) return

    if (micState === 'recording') {
      await stopCapture({ submit: false })
    }

    const nextTranscript = liveTranscriptRef.current.trim() || draftTranscript.trim()
    if (!nextTranscript) return

    setDraftTranscript(nextTranscript)
    setLiveTranscript(nextTranscript)
    setFinalTranscript(nextTranscript)
    setIsEditingDraft(true)
    setMicState('done')
  }

  const liveTranscriptClass = `sp-live-transcript ${micState === 'recording' ? 'active' : ''} ${liveFading ? 'fading-out' : ''}`.trim()
  const buttonState = micState === 'processing' ? 'processing' : micState === 'recording' ? 'recording' : 'idle'
  const canSendMic = micState === 'recording' || Boolean((isEditingDraft ? draftTranscript : liveTranscript).trim())
  const canResetMic = micState === 'recording' || micState === 'done' || Boolean(liveTranscript.trim())
  const canEditMic = micState === 'done' || Boolean(liveTranscript.trim())

  return (
    <>
      {isEditingDraft ? (
        <textarea
          className="sp-draft-editor"
          value={draftTranscript}
          onChange={(event) => {
            const nextValue = event.target.value
            setDraftTranscript(nextValue)
            setLiveTranscript(nextValue)
            setFinalTranscript(nextValue)
          }}
          placeholder="Corrige ici le texte reconnu avant l'envoi."
          rows={3}
        />
      ) : (
        <div className={liveTranscriptClass}>
          {micState === 'processing'
            ? 'Analyse...'
            : liveTranscript || 'Parle en allemand puis appuie sur envoyer.'}
        </div>
      )}

      {(typeof isSupported === 'boolean' ? isSupported : support?.stt) ? (
        <div className="sp-mic-row">
          <button
            type="button"
            className={`sp-mic-btn ${buttonState}`}
            disabled={(busy && micState !== 'recording') || isSubmittingMic}
            onClick={() => {
              if (micState === 'idle') startCapture()
              else if (micState === 'recording') stopCapture({ submit: false })
              else startCapture()
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

          <button
            type="button"
            className="sp-send-btn"
            onClick={handleSend}
            disabled={!canSendMic || isSubmittingMic || micState === 'processing'}
            aria-label="Envoyer le message vocal"
          >
            <Send size={16} />
          </button>

          <button
            type="button"
            className="sp-reset-btn"
            onClick={handleReset}
            disabled={!canResetMic || isSubmittingMic || micState === 'processing'}
            aria-label="Recommencer l'enregistrement"
          >
            <RotateCcw size={16} />
          </button>

          <button
            type="button"
            className="sp-edit-btn"
            onClick={handleDraftEdit}
            disabled={!canEditMic || isSubmittingMic || micState === 'processing'}
            aria-label="Modifier le texte reconnu"
          >
            <Pencil size={16} />
          </button>
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
