import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronUp, Info } from 'lucide-react'
import { useConversation } from '../../hooks/useConversation'
import { useSpeech } from '../../hooks/useSpeech'
import { useSessionStore, SESSION_VIEWS } from '../../stores/sessionStore'
import ChatTimeline from './ChatTimeline'
import ConfidenceMeter from './ConfidenceMeter'
import ImmersiveBackground from './ImmersiveBackground'
import MicInterface from './MicInterface'
import RescueSystem from './RescueSystem'
import VocabCollector from './VocabCollector'

export default function SessionView({ onSessionEnd, onXPEarned }) {
  const session = useSessionStore()
  const speech = useSpeech()
  const [mobileContextOpen, setMobileContextOpen] = useState(false)
  const { startScene, processTextTurn, handleMicRelease, endSession } = useConversation(undefined, {
    onSessionEnd,
    onXPEarned,
  })

  useEffect(() => {
    useSessionStore.getState().setSpeechSupport({
      ...(speech.support || {}),
      stt: typeof speech.isSupported === 'boolean' ? speech.isSupported : speech.support?.stt,
    })
  }, [speech.isSupported, speech.support])

  useEffect(() => {
    if (
      session.currentView !== SESSION_VIEWS.SESSION ||
      !session.selectedTheme ||
      !session.selectedCharacter ||
      session.hasSessionStarted
    ) {
      return
    }
    startScene()
  }, [session.currentView, session.hasSessionStarted, session.selectedCharacter, session.selectedTheme, startScene])

  useEffect(() => {
    setMobileContextOpen(false)
  }, [session.selectedCharacter?.id, session.selectedTheme?.id])

  useEffect(() => {
    if (
      session.currentView !== SESSION_VIEWS.SESSION ||
      !session.lastAiMessageTime ||
      session.isAiSpeaking ||
      session.isAiThinking ||
      session.isUserSpeaking
    ) {
      return undefined
    }

    const elapsed = Date.now() - session.lastAiMessageTime
    const timers = [7000, 12000, 18000]
      .map((threshold, index) => {
        const nextLevel = index + 1
        if (session.currentHintLevel >= nextLevel) return null
        return window.setTimeout(
          () => useSessionStore.getState().setHintLevel(nextLevel, true),
          Math.max(threshold - elapsed, 0)
        )
      })
      .filter(Boolean)

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [
    session.currentHintLevel,
    session.currentView,
    session.isAiSpeaking,
    session.isAiThinking,
    session.isUserSpeaking,
    session.lastAiMessageTime,
  ])

  const lastAiMessage = useMemo(
    () => [...session.conversationHistory].reverse().find((message) => message.role === 'ai')?.content || '',
    [session.conversationHistory]
  )
  const maxTurns = Math.max(1, Math.min(session.selectedTheme?.expectedTurns || 0, 8))
  const currentTurn = Math.min(Math.max(session.currentTurn || 1, 1), maxTurns)

  const handleSuggestion = useCallback(async (text) => {
    await processTextTurn(text, { responseTimeMs: 0 })
  }, [processTextTurn])

  if (!session.selectedTheme || !session.selectedCharacter) return null

  return (
    <div className="sp-root">
      <ImmersiveBackground themeBgKey={session.selectedTheme.bgTheme} />

      <div className="sp-shell">
        <div className="sp-header">
          <div className="sp-avatar-wrap">
            <div className={`sp-avatar ${session.selectedCharacter.id || session.selectedCharacter.name?.toLowerCase()}`}>
              <span>{session.selectedCharacter.emoji || session.selectedCharacter.name?.[0] || 'A'}</span>
            </div>
            <div className="sp-avatar-copy">
              <div className="sp-char-topline">
                <div className="sp-char-name">{session.selectedCharacter.name}</div>
                <button
                  type="button"
                  className="sp-mobile-context-toggle"
                  onClick={() => setMobileContextOpen((value) => !value)}
                  aria-expanded={mobileContextOpen}
                  aria-label={mobileContextOpen ? 'Masquer le contexte de scene' : 'Afficher le contexte de scene'}
                >
                  {mobileContextOpen ? <ChevronUp size={16} /> : <Info size={16} />}
                </button>
              </div>
              <div className="sp-char-sub sp-desktop-copy">{session.selectedTheme.description}</div>
              <div className="sp-char-sub sp-mobile-copy">
                Tour {currentTurn}/{maxTurns}
              </div>
            </div>
          </div>

          <div className="sp-hud">
            <div className="sp-level-badge">{session.selectedLevel}</div>
            <div className="sp-vocab-counter">{session.collectedWords.length} mots</div>
            <div className="sp-turn-dots sp-turn-dots-desktop">
              {Array.from({ length: session.selectedTheme.expectedTurns }).slice(0, 8).map((_, index) => (
                <span
                  key={`dot-${index}`}
                  className={`sp-turn-dot ${index + 1 < session.currentTurn ? 'done' : ''} ${index + 1 === session.currentTurn ? 'current' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>

        {mobileContextOpen && (
          <div className="sp-mobile-context">
            <div className="sp-mobile-context-grid">
              <div className="sp-mobile-context-card">
                <span className="sp-mobile-context-label">Scene</span>
                <p>{session.selectedTheme.description}</p>
              </div>
              <div className="sp-mobile-context-card">
                <span className="sp-mobile-context-label">Progression</span>
                <p>Tour {currentTurn}/{maxTurns}. {session.collectedWords.length} mots deja gardes.</p>
              </div>
            </div>

            {session.selectedTheme.vocabularyHints?.length ? (
              <div className="sp-mobile-pill-row">
                {session.selectedTheme.vocabularyHints.slice(0, 3).map((word) => (
                  <span key={word} className="sp-mobile-pill">
                    {word}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {session.isTwistTriggered && <div className="sp-twist-alert">{session.selectedTheme.possibleTwist}</div>}

        <ChatTimeline
          conversationHistory={session.conversationHistory}
          character={session.selectedCharacter}
          isAiThinking={session.isAiThinking}
        />

        <RescueSystem
          hintLevel={session.currentHintLevel}
          theme={session.selectedTheme}
          level={session.selectedLevel}
          lastAiMessage={lastAiMessage}
          onDismiss={() => session.resetHints()}
          onUseSuggestion={handleSuggestion}
        />

        <div className="sp-bottom">
          <ConfidenceMeter confidenceScore={session.confidenceScore} />
          <MicInterface speech={speech} onSubmit={processTextTurn} onMicRelease={handleMicRelease} />
        </div>

        <VocabCollector
          words={session.newWordsSpotted}
          collectedCount={session.collectedWords.length}
          onCollect={session.collectWord}
        />

        <button type="button" className="sp-end-btn" onClick={() => endSession()}>
          Terminer
        </button>
      </div>
    </div>
  )
}
