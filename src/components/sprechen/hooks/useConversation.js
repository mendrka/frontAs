import { useCallback, useRef } from 'react'
import {
  addTurn,
  analyzeCorrection,
  endSession as endRemoteSession,
  isValidSessionId,
  sendAudioForSTT,
  sendMessage,
  startSession as startRemoteSession,
} from '../services/sprechenAPI'
import { useAudio } from './useAudio'
import { useProgressStore } from '../stores/progressStore'
import { useSessionStore } from '../stores/sessionStore'
import { average, computeConfidenceScore, extractVocabularyCandidates, summarizeSession } from '../utils'

export function useConversation(_runtimeConfig, { onSessionEnd = () => {}, onXPEarned = () => {} } = {}) {
  const { speakText } = useAudio()
  const startSceneLockRef = useRef(false)
  const finalizeTurnLockRef = useRef(false)

  const startScene = useCallback(async () => {
    const sessionState = useSessionStore.getState()
    const progressState = useProgressStore.getState()

    if (
      startSceneLockRef.current ||
      sessionState.hasSessionStarted ||
      !sessionState.selectedTheme ||
      !sessionState.selectedCharacter ||
      !sessionState.selectedLevel
    ) {
      return
    }

    const actions = useSessionStore.getState()
    startSceneLockRef.current = true
    actions.setIsAiThinking(true)
    actions.setErrorMessage(null)
    try {
      actions.markSessionStarted()
      const sessionResponse = await startRemoteSession({
        mode: sessionState.selectedMode,
        level: sessionState.selectedLevel,
        themeId: sessionState.selectedTheme?.id,
        characterId: sessionState.selectedCharacter?.id,
      })
      actions.setSessionId(sessionResponse?.sessionId || null)

      const aiResult = await sendMessage({
        sessionId: sessionResponse?.sessionId || null,
        messages: [],
        systemContext: {
          characterId: sessionState.selectedCharacter?.id,
          themeId: sessionState.selectedTheme?.id,
          level: sessionState.selectedLevel,
          turn: 0,
          isTwistTurn: false,
          userWeaknesses: progressState.weaknesses,
        },
      })
      const aiResponse = aiResult?.content || ''

      const spottedWords = extractVocabularyCandidates(
        aiResponse,
        sessionState.selectedTheme.vocabularyHints,
        sessionState.collectedWords
      )

      actions.addMessage('ai', aiResponse)
      if (isValidSessionId(sessionResponse?.sessionId)) {
        addTurn(sessionResponse.sessionId, { role: 'ai', content: aiResponse }).catch(() => {})
      }
      actions.spotWords(spottedWords)
      actions.setLastAiMessageTime(Date.now())
      actions.setIsAiSpeaking(true)
      await speakText(aiResponse, sessionState.selectedCharacter?.id)
      useSessionStore.getState().setIsAiSpeaking(false)
    } catch (error) {
      useSessionStore.setState({ hasSessionStarted: false, sessionId: null })
      actions.setErrorMessage(error?.message || 'Impossible de demarrer la session.')
    } finally {
      startSceneLockRef.current = false
      useSessionStore.getState().setIsAiThinking(false)
      useSessionStore.getState().setIsAiSpeaking(false)
    }
  }, [speakText])

  const endSession = useCallback(async () => {
    const sessionState = useSessionStore.getState()
    const progressState = useProgressStore.getState()
    if (!sessionState.selectedTheme || !sessionState.selectedCharacter || !sessionState.selectedLevel) return

    const vocabularyUsed = sessionState.selectedTheme.vocabularyHints.filter((hint) =>
      sessionState.conversationHistory
        .filter((message) => message.role === 'user')
        .some((message) => message.content.toLowerCase().includes(hint.toLowerCase()))
    ).length

    const avgResponseMs = average(sessionState.responseTimes)
    const avgScore = average(sessionState.turnScores)
    const scores = {
      average: Math.round(avgScore),
      correct: sessionState.turnScores.filter((score) => score >= 70).length,
      avgResponseTime: Number((avgResponseMs / 1000).toFixed(1)),
      vocabularyUsed,
      phonology: Math.round(avgScore * 0.88 || 32),
      fluency: avgResponseMs < 3000 ? 86 : avgResponseMs < 6000 ? 67 : 48,
      vocabulary: Math.round(
        (vocabularyUsed / Math.max(sessionState.selectedTheme.vocabularyHints.length, 1)) * 100
      ),
      grammar: Math.round(avgScore || 30),
      reactivity: avgResponseMs < 3000 ? 90 : avgResponseMs < 6000 ? 70 : 52,
    }

    let feedback = {
      characterMessage: 'Session terminee.',
      globalScore: scores.average,
      strengths: [],
      toImprove: [],
      tip: 'Continue avec une nouvelle session pour consolider.',
      xpEarned: 0,
      badges: [],
    }
    let resolvedScores = scores

    if (isValidSessionId(sessionState.sessionId)) {
      try {
        const remoteResult = await endRemoteSession(sessionState.sessionId)
        feedback = {
          ...feedback,
          ...(remoteResult?.feedback || {}),
          xpEarned: remoteResult?.xpBreakdown?.total ?? remoteResult?.feedback?.xpEarned ?? feedback.xpEarned,
          badges:
            remoteResult?.feedback?.badges ||
            remoteResult?.session?.badgesEarned ||
            feedback.badges,
        }
        if (remoteResult?.session?.scores) {
          resolvedScores = {
            ...resolvedScores,
            ...remoteResult.session.scores,
            average: remoteResult.session.scores.global ?? resolvedScores.average,
          }
        }
      } catch {
        feedback = {
          ...feedback,
          characterMessage: 'Session terminee. Le feedback detaille du serveur est indisponible.',
        }
      }
    }

    const sessionSummary = summarizeSession({
      theme: sessionState.selectedTheme,
      character: sessionState.selectedCharacter,
      level: sessionState.selectedLevel,
      transcript: sessionState.conversationHistory,
      feedback,
      scores: resolvedScores,
      hintsUsed: sessionState.hintsUsed,
    })

    progressState.addXP(feedback.xpEarned)
    progressState.updateStreak()
    progressState.updateDNA(resolvedScores)
    const earnedBadges = feedback.badges || []
    earnedBadges.forEach((badge) => progressState.addBadge(badge))
    progressState.addSession(sessionSummary)

    useSessionStore.getState().endSession({ ...feedback, scores: resolvedScores, summary: sessionSummary })
    Promise.resolve(onXPEarned(feedback.xpEarned)).catch(() => {})
    Promise.resolve(onSessionEnd({ ...sessionSummary, feedback, transcript: sessionState.conversationHistory, scores: resolvedScores })).catch(() => {})
  }, [onSessionEnd, onXPEarned])

  const finalizeTurn = useCallback(async (transcript, meta = {}) => {
    const trimmed = String(transcript || '').trim()
    if (!trimmed) {
      useSessionStore.getState().setMicState('idle')
      return
    }

    if (finalizeTurnLockRef.current) {
      return
    }

    const sessionState = useSessionStore.getState()
    const actions = useSessionStore.getState()
    if (!sessionState.selectedTheme || !sessionState.selectedCharacter || !sessionState.selectedLevel) return
    finalizeTurnLockRef.current = true

    const responseTimeMs =
      meta.responseTimeMs ?? Math.max(Date.now() - (sessionState.lastAiMessageTime || Date.now()), 0)
    const confidenceScore = computeConfidenceScore({
      responseTimeMs,
      hesitationCount: 0,
      wordCount: trimmed.split(/\s+/).filter(Boolean).length,
    })

    actions.resetHints()
    actions.setErrorMessage(null)
    actions.setLiveTranscript('')
    actions.setFinalTranscript(trimmed)
    actions.setIsUserSpeaking(false)
    actions.addMessage('user', trimmed, null, { pending: true, responseTimeMs })
    actions.setMicState('done')
    if (isValidSessionId(sessionState.sessionId)) {
      addTurn(sessionState.sessionId, {
        role: 'user',
        content: trimmed,
        metrics: { responseTimeMs, confidenceScore },
      }).catch(() => {})
    }

    const historyForRequests = useSessionStore.getState().conversationHistory.map((message) => ({
      role: message.role,
      content: message.content,
    }))
    const currentTurn = useSessionStore.getState().currentTurn
    const isTwistTurn =
      !sessionState.isTwistTriggered &&
      currentTurn >= sessionState.selectedTheme.twistTrigger

    let correction = null
    let aiResponse = null
    try {
      const turnResults = await Promise.all([
        analyzeCorrection({
          userText: trimmed,
          conversationHistory: historyForRequests.slice(-7, -1),
          level: sessionState.selectedLevel,
          themeId: sessionState.selectedTheme?.id,
        }),
        sendMessage({
          sessionId: isValidSessionId(sessionState.sessionId) ? sessionState.sessionId : null,
          messages: historyForRequests,
          systemContext: {
            characterId: sessionState.selectedCharacter?.id,
            themeId: sessionState.selectedTheme?.id,
            level: sessionState.selectedLevel,
            turn: currentTurn,
            isTwistTurn,
          },
        }),
      ])
      correction = turnResults[0]
      aiResponse = turnResults[1]
    } catch (error) {
      actions.updateLastUserMessage({ correction: null, responseTimeMs })
      actions.setMicState('idle')
      actions.setErrorMessage(error?.message || 'La reponse IA a echoue.')
      finalizeTurnLockRef.current = false
      return
    }

    window.setTimeout(() => {
      useSessionStore.getState().updateLastUserMessage({ correction, responseTimeMs })
      if (correction?.weaknessDetected) {
        useProgressStore.getState().addWeakness(correction.weaknessDetected)
      }
      useSessionStore.getState().recordTurnMetrics({
        responseTime: responseTimeMs,
        score: correction?.score || 0,
        hesitationCount: 0,
        confidenceScore,
      })
    }, 800)

    window.setTimeout(() => {
      useSessionStore.getState().setConfidenceScore(confidenceScore)
    }, 900)

    window.setTimeout(async () => {
      try {
        const content = aiResponse?.content || aiResponse?.message || ''
        const afterUserState = useSessionStore.getState()
        const shouldTwist =
          !afterUserState.isTwistTriggered &&
          afterUserState.currentTurn >= afterUserState.selectedTheme.twistTrigger

        if (shouldTwist) {
          useSessionStore.getState().triggerTwist()
        }

        useSessionStore.getState().addMessage('ai', content)
        if (isValidSessionId(afterUserState.sessionId)) {
          addTurn(afterUserState.sessionId, { role: 'ai', content }).catch(() => {})
        }
        const seenWords = [
          ...afterUserState.collectedWords,
          ...afterUserState.newWordsSpotted,
          ...afterUserState.conversationHistory
            .filter((message) => message.role === 'ai')
            .flatMap((message) => message.content.split(/\s+/)),
        ]
        const spottedWords = extractVocabularyCandidates(
          content,
          afterUserState.selectedTheme.vocabularyHints,
          seenWords
        )
        useSessionStore.getState().spotWords(spottedWords)
        useSessionStore.getState().setLastAiMessageTime(Date.now())
        useSessionStore.getState().setMicState('idle')
        useSessionStore.getState().setIsAiSpeaking(true)
        await speakText(content, afterUserState.selectedCharacter?.id)
        useSessionStore.getState().setIsAiSpeaking(false)

        if (useSessionStore.getState().currentTurn >= afterUserState.selectedTheme.expectedTurns) {
          await endSession()
        }
      } finally {
        finalizeTurnLockRef.current = false
      }
    }, 1000)
  }, [endSession, speakText])

  const processTextTurn = useCallback(async (text, meta = {}) => {
    useSessionStore.getState().setMicState('processing')
    await finalizeTurn(text, meta)
  }, [finalizeTurn])

  const handleMicRelease = useCallback(async ({ stopRecording, liveTranscriptRef, submit = true } = {}) => {
    const actions = useSessionStore.getState()
    actions.setMicState('processing')

    const { blob, responseTimeMs } = await stopRecording()
    let transcript = liveTranscriptRef?.current?.trim() || null

    if (blob && blob.size >= 1000) {
      try {
        const result = await sendAudioForSTT(blob)
        transcript = result?.fallback
          ? liveTranscriptRef?.current?.trim() || transcript
          : result?.transcript?.trim() || transcript
      } catch {
        transcript = liveTranscriptRef?.current?.trim() || transcript
      }
    }

    if (!transcript) {
      actions.setMicState('idle')
      return
    }

    if (!submit) {
      actions.setLiveTranscript(transcript)
      actions.setFinalTranscript(transcript)
      actions.setMicState('done')
      return transcript
    }

    window.setTimeout(() => useSessionStore.getState().setLiveTranscript(''), 200)
    await finalizeTurn(transcript, { responseTimeMs })
    return transcript
  }, [finalizeTurn])

  return {
    startScene,
    processTextTurn,
    handleMicRelease,
    endSession,
  }
}
