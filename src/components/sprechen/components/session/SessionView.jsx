import { useCallback, useEffect, useMemo } from 'react'
import { useConversation } from '../../hooks/useConversation'
import { useSpeech } from '../../hooks/useSpeech'
import { useSessionStore, SESSION_VIEWS } from '../../stores/sessionStore'
import ChatTimeline from './ChatTimeline'
import ConfidenceMeter from './ConfidenceMeter'
import ImmersiveBackground from './ImmersiveBackground'
import MicInterface from './MicInterface'
import RescueSystem from './RescueSystem'
import VocabCollector from './VocabCollector'

export default function SessionView({ runtimeConfig, onSessionEnd, onXPEarned }) {
  const session = useSessionStore()
  const speech = useSpeech()
  const { startScene, processTextTurn, handleMicRelease, endSession } = useConversation(runtimeConfig, {
    onSessionEnd,
    onXPEarned,
  })

  useEffect(() => {
    useSessionStore.getState().setSpeechSupport(speech.support)
  }, [speech.support])

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
            <div>
              <div className="sp-char-name">{session.selectedCharacter.name}</div>
              <div className="sp-char-sub">{session.selectedTheme.description}</div>
            </div>
          </div>

          <div className="sp-hud">
            <div className="sp-level-badge">{session.selectedLevel}</div>
            <div className="sp-vocab-counter">{session.collectedWords.length} mots</div>
            <div className="sp-turn-dots">
              {Array.from({ length: session.selectedTheme.expectedTurns }).slice(0, 8).map((_, index) => (
                <span
                  key={`dot-${index}`}
                  className={`sp-turn-dot ${index + 1 < session.currentTurn ? 'done' : ''} ${index + 1 === session.currentTurn ? 'current' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>

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
