import { lazy, Suspense, useEffect } from 'react'
import { stopListening, stopSpeaking } from './services/speechService'
import './styles/sprechen.css'
import { resolveTheme, normalizeLevel, pickDefaultCharacter, cn } from './utils'
import { useSessionStore, SESSION_VIEWS } from './stores/sessionStore'

const OnboardingWizard = lazy(() => import('./components/onboarding/OnboardingWizard'))
const FeedbackScreen = lazy(() => import('./components/feedback/FeedbackScreen'))
const SessionJournal = lazy(() => import('./components/session/SessionJournal'))
const SessionView = lazy(() => import('./components/session/SessionView'))

function SprechenViewFallback() {
  return (
    <div className="flex min-h-[22rem] items-center justify-center rounded-[2rem] border border-white/60 bg-white/72 p-6 shadow-soft">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand-border border-t-brand-blue" />
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-brand-brown">
          Chargement de l interface
        </p>
      </div>
    </div>
  )
}

export default function SprechenComponent({
  user = null,
  userLevel = null,
  theme = null,
  onSessionEnd = () => {},
  onXPEarned = () => {},
  className = '',
  fullscreen = false,
  defaultView = null,
}) {
  const {
    currentView,
    selectedLevel,
    selectedTheme,
    selectedCharacter,
    setSelectedLevel,
    setSelectedTheme,
    setSelectedCharacter,
    setCurrentView,
  } = useSessionStore()

  const resolvedUserLevel = user?.level ?? user?.germanLevel ?? userLevel ?? null

  const presetLevel = normalizeLevel(resolvedUserLevel)
  const presetTheme = resolveTheme(theme)

  useEffect(() => {
    if (presetLevel && !selectedLevel) {
      setSelectedLevel(presetLevel)
    }
  }, [presetLevel, selectedLevel, setSelectedLevel])

  useEffect(() => {
    if (!defaultView) return
    if (Object.values(SESSION_VIEWS).includes(defaultView)) {
      setCurrentView(defaultView)
    }
  }, [defaultView, setCurrentView])

  useEffect(() => {
    if (!presetTheme) return
    if (!selectedLevel) setSelectedLevel(presetTheme.level)
    if (!selectedTheme || selectedTheme.id !== presetTheme.id) {
      setSelectedTheme(presetTheme)
    }
    if (!selectedCharacter) {
      setSelectedCharacter(pickDefaultCharacter(presetTheme.id))
    }
  }, [
    presetTheme,
    selectedCharacter,
    selectedLevel,
    selectedTheme,
    setSelectedCharacter,
    setSelectedLevel,
    setSelectedTheme,
  ])

  useEffect(
    () => () => {
      stopSpeaking()
      stopListening()
    },
    []
  )

  return (
    <div className={cn('sprechen-root', fullscreen && 'sprechen-fullscreen', className)}>
      <Suspense fallback={<SprechenViewFallback />}>
        {currentView === SESSION_VIEWS.ONBOARDING && (
          <OnboardingWizard presetLevel={presetLevel} presetThemeId={presetTheme?.id || null} />
        )}
        {currentView === SESSION_VIEWS.SESSION && (
          <SessionView
            onSessionEnd={onSessionEnd}
            onXPEarned={onXPEarned}
          />
        )}
        {currentView === SESSION_VIEWS.FEEDBACK && <FeedbackScreen />}
        {currentView === SESSION_VIEWS.JOURNAL && <SessionJournal />}
      </Suspense>
    </div>
  )
}
