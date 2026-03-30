import { useEffect } from 'react'
import { stopListening, stopSpeaking } from './services/speechService'
import './styles/sprechen.css'
import OnboardingWizard from './components/onboarding/OnboardingWizard'
import FeedbackScreen from './components/feedback/FeedbackScreen'
import SessionJournal from './components/session/SessionJournal'
import SessionView from './components/session/SessionView'
import { resolveTheme, normalizeLevel, pickDefaultCharacter, cn } from './utils'
import { useSessionStore, SESSION_VIEWS } from './stores/sessionStore'

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
    </div>
  )
}
