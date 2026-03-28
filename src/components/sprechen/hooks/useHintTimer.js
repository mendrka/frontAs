import { useCallback, useEffect, useRef } from 'react'
import { useSessionStore } from '../stores/sessionStore'
import { requestHint } from '../services/sprechenAPI'

export const useHintTimer = ({ themeContext, conversationHistory }) => {
  const timer5 = useRef(null)
  const timer10 = useRef(null)
  const timer15 = useRef(null)

  const showHint = useSessionStore((s) => s.showHint)
  const hideHint = useSessionStore((s) => s.hideHint)
  const sessionId = useSessionStore((s) => s.sessionId)
  const incrementHints = useSessionStore((s) => s.incrementHints)

  const clearAllTimers = useCallback(() => {
    clearTimeout(timer5.current)
    clearTimeout(timer10.current)
    clearTimeout(timer15.current)
  }, [])

  const startHintTimer = useCallback(() => {
    clearAllTimers()
    hideHint?.()

    timer5.current = setTimeout(async () => {
      try {
        const result = await requestHint({
          sessionId,
          silenceDurationSeconds: 5,
          conversationHistory: (conversationHistory || []).slice(-4),
          themeContext,
        })
        showHint?.(result?.content, 1)
        incrementHints?.()
      } catch (e) {
        void e
      }
    }, 5000)

    timer10.current = setTimeout(async () => {
      try {
        const result = await requestHint({
          sessionId,
          silenceDurationSeconds: 10,
          conversationHistory: (conversationHistory || []).slice(-4),
          themeContext,
        })
        showHint?.(result?.content, 2)
      } catch (e) {
        void e
      }
    }, 10000)

    timer15.current = setTimeout(async () => {
      try {
        const result = await requestHint({
          sessionId,
          silenceDurationSeconds: 15,
          conversationHistory: (conversationHistory || []).slice(-4),
          themeContext,
        })
        showHint?.(result?.content, 3)
      } catch (e) {
        void e
      }
    }, 15000)
  }, [
    clearAllTimers,
    conversationHistory,
    hideHint,
    incrementHints,
    sessionId,
    showHint,
    themeContext,
  ])

  useEffect(() => () => clearAllTimers(), [clearAllTimers])

  return { startHintTimer, clearAllTimers }
}
