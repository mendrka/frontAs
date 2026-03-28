import { useCallback } from 'react'
import { buildSystemPrompt } from '../data/prompts'
import { generateFinalFeedback, getAIResponse } from '../services/aiService'
import { analyzeCorrection, sendAudioForSTT, sendMessage } from '../services/sprechenAPI'
import { useAudio } from './useAudio'
import { useProgressStore } from '../stores/progressStore'
import { useSessionStore } from '../stores/sessionStore'
import { average, computeConfidenceScore, extractVocabularyCandidates, summarizeSession } from '../utils'

function createApiConfig(runtimeConfig, extras = {}) {
  return {
    apiEndpoint: runtimeConfig.apiEndpoint,
    groqKey: runtimeConfig.groqApiKey,
    geminiKey: runtimeConfig.geminiApiKey,
    ...extras,
  }
}

export function useConversation(runtimeConfig, callbacks = {}) {
  const onSessionEnd = callbacks.onSessionEnd || (() => {})
  const onXPEarned = callbacks.onXPEarned || (() => {})
  const { speakText } = useAudio()

  const startScene = useCallback(async () => {
    const sessionState = useSessionStore.getState()

    if (
      sessionState.hasSessionStarted ||
      !sessionState.selectedTheme ||
      !sessionState.selectedCharacter ||
      !sessionState.selectedLevel
    ) {
      return
    }

    const actions = useSessionStore.getState()
    actions.setIsAiThinking(true)
    actions.setErrorMessage(null)

    const systemPrompt = buildSystemPrompt(
      sessionState.selectedCharacter,
      sessionState.selectedTheme,
      sessionState.selectedLevel,
      progressState.weaknesses
    )

    const aiResponse = await getAIResponse([], systemPrompt, createApiConfig(runtimeConfig, {
      theme: sessionState.selectedTheme,
      character: sessionState.selectedCharacter,
      level: sessionState.selectedLevel,
    }))

    const spottedWords = extractVocabularyCandidates(
      aiResponse,
      sessionState.selectedTheme.vocabularyHints,
      sessionState.collectedWords
    )

    actions.addMessage('ai', aiResponse)
    actions.spotWords(spottedWords)
    actions.setLastAiMessageTime(Date.now())
    actions.markSessionStarted()
    actions.setIsAiThinking(false)
    actions.setIsAiSpeaking(true)
    await speakText(aiResponse, sessionState.selectedCharacter?.id)
    useSessionStore.getState().setIsAiSpeaking(false)
  }, [runtimeConfig, speakText])

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

    const feedback = await generateFinalFeedback({
      transcript: sessionState.conversationHistory,
      scores,
      theme: sessionState.selectedTheme,
      character: sessionState.selectedCharacter,
      level: sessionState.selectedLevel,
      hintsUsed: sessionState.hintsUsed,
      sessionCount: progressState.sessionsCount,
    }, createApiConfig(runtimeConfig, {
      theme: sessionState.selectedTheme,
      character: sessionState.selectedCharacter,
      level: sessionState.selectedLevel,
    }))

    const sessionSummary = summarizeSession({
      theme: sessionState.selectedTheme,
      character: sessionState.selectedCharacter,
      level: sessionState.selectedLevel,
      transcript: sessionState.conversationHistory,
      feedback,
      scores,
      hintsUsed: sessionState.hintsUsed,
    })

    progressState.addXP(feedback.xpEarned)
    progressState.updateStreak()
    progressState.updateDNA(scores)
    feedback.badges.forEach((badge) => progressState.addBadge(badge))
    progressState.addSession(sessionSummary)

    useSessionStore.getState().endSession({ ...feedback, scores, summary: sessionSummary })
    Promise.resolve(onXPEarned(feedback.xpEarned)).catch(() => {})
    Promise.resolve(onSessionEnd({ ...sessionSummary, feedback, transcript: sessionState.conversationHistory, scores })).catch(() => {})
  }, [onSessionEnd, onXPEarned, runtimeConfig])

  const finalizeTurn = useCallback(async (transcript, meta = {}) => {
    const trimmed = String(transcript || '').trim()
    if (!trimmed) {
      useSessionStore.getState().setMicState('idle')
      return
    }

    const sessionState = useSessionStore.getState()
    const progressState = useProgressStore.getState()
    const actions = useSessionStore.getState()
    if (!sessionState.selectedTheme || !sessionState.selectedCharacter || !sessionState.selectedLevel) return

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

    const historyForRequests = useSessionStore.getState().conversationHistory.map((message) => ({
      role: message.role,
      content: message.content,
    }))

    const [correction, aiResponse] = await Promise.all([
      analyzeCorrection({
        userText: trimmed,
        conversationHistory: historyForRequests.slice(-7, -1),
        level: sessionState.selectedLevel,
        themeId: sessionState.selectedTheme?.id,
      }),
      sendMessage({
        sessionId: sessionState.sessionId,
        messages: historyForRequests,
        systemContext: {
          characterId: sessionState.selectedCharacter?.id,
          themeId: sessionState.selectedTheme?.id,
          level: sessionState.selectedLevel,
        },
      }),
    ])

    window.setTimeout(() => {
      useSessionStore.getState().updateLastUserMessage({ correction, responseTimeMs })
      if (correction?.weaknessDetected) {
        useProgressStore.getState().addWeakness(correction.weaknessDetected)
      }
      useSessionStore.getState().recordTurnMetrics({
        responseTime: responseTimeMs,
        score: correction?.score || 0,
        hesitationCount: 0,
        confidenceScore: useSessionStore.getState().confidenceScore,
      })
    }, 800)

    window.setTimeout(() => {
      useSessionStore.getState().setConfidenceScore(confidenceScore)
    }, 900)

    window.setTimeout(async () => {
      const content = aiResponse?.content || aiResponse?.message || ''
      const afterUserState = useSessionStore.getState()
      const shouldTwist =
        !afterUserState.isTwistTriggered &&
        afterUserState.currentTurn >= afterUserState.selectedTheme.twistTrigger

      if (shouldTwist) {
        useSessionStore.getState().triggerTwist()
      }

      useSessionStore.getState().addMessage('ai', content)
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
    }, 1000)
  }, [endSession, speakText])

  const processTextTurn = useCallback(async (text, meta = {}) => {
    useSessionStore.getState().setMicState('processing')
    await finalizeTurn(text, meta)
  }, [finalizeTurn])

  const handleMicRelease = useCallback(async ({ stopRecording, liveTranscriptRef } = {}) => {
    const actions = useSessionStore.getState()
    actions.setMicState('processing')

    const { blob, responseTimeMs } = await stopRecording()
    if (!blob || blob.size < 1000) {
      actions.setMicState('idle')
      actions.setLiveTranscript('')
      return
    }

    window.setTimeout(() => useSessionStore.getState().setLiveTranscript(''), 200)

    let transcript = null
    try {
      const result = await sendAudioForSTT(blob)
      transcript = result?.fallback
        ? liveTranscriptRef?.current?.trim() || null
        : result?.transcript?.trim() || null
    } catch {
      transcript = liveTranscriptRef?.current?.trim() || null
    }

    if (!transcript) {
      actions.setMicState('idle')
      return
    }

    await finalizeTurn(transcript, { responseTimeMs })
  }, [finalizeTurn])

  return {
    startScene,
    processTextTurn,
    handleMicRelease,
    endSession,
  }
}
