import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGamification } from '@context/GamificationContext'
import { useProgression } from '@hooks/useProgression'
import {
  buildLevelUnlockMap,
  findLessonById,
  findNextLesson,
  normalizeLevel,
} from '@data/lessonCatalog'

const LETTERS = ['A', 'B', 'C', 'D']

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildLessonSteps(phrases = [], exercises = []) {
  const steps = []
  const count = Math.max(phrases.length, exercises.length)

  for (let index = 0; index < count; index += 1) {
    if (phrases[index]) {
      steps.push({ type: 'phrase', id: `phrase-${phrases[index].id || index}`, data: phrases[index] })
    }
    if (exercises[index]) {
      steps.push({ type: 'exercice', id: `exercise-${exercises[index].id || index}`, data: exercises[index] })
    }
  }

  steps.push({ type: 'complete', id: 'complete', data: null })
  return steps
}

function isChoiceExercise(exercise) {
  return exercise?.type === 'qcm'
}

function evaluateExercise(exercise, value) {
  if (!exercise) return false

  if (isChoiceExercise(exercise)) {
    return value === exercise.reponse
  }

  const userAnswer = normalizeText(value)
  if (!userAnswer) return false

  const accepted = [
    exercise.reponse,
    ...(Array.isArray(exercise.accepte) ? exercise.accepte : []),
    exercise.answer,
  ]
    .map(normalizeText)
    .filter(Boolean)

  if (accepted.includes(userAnswer)) return true

  if (exercise.evaluationMode === 'keywords' && Array.isArray(exercise.keywords) && exercise.keywords.length) {
    const matched = exercise.keywords.filter((keyword) => userAnswer.includes(normalizeText(keyword))).length
    return matched / exercise.keywords.length >= Number(exercise.keywordThreshold || 0.6)
  }

  return false
}

function exercisePrompt(exercise) {
  if (!exercise) return ''
  return exercise.questionFr || exercise.questionDe || exercise.promptFr || exercise.promptDe || exercise.sourceFr || exercise.sourceDe || 'Choisis la bonne réponse.'
}

function exerciseChoices(exercise) {
  if (!isChoiceExercise(exercise)) return []
  return (exercise.options || []).slice(0, 4).map((option, index) => ({
    id: `${exercise.id}-choice-${index}`,
    label: option.fr || option.de || String(option),
    value: index,
  }))
}

function detailChips(phrase) {
  const chips = Array.isArray(phrase?.notes) ? phrase.notes : []
  return chips.slice(0, 6)
}

function usePhraseAudio() {
  const audioRef = useRef(null)
  const utteranceRef = useRef(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (window.speechSynthesis && utteranceRef.current) {
      window.speechSynthesis.cancel()
    }
  }, [])

  const play = async (phrase) => {
    if (!phrase) return

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    setPlaying(true)

    if (phrase.audioUrl) {
      const audio = new Audio(phrase.audioUrl)
      audioRef.current = audio
      audio.onended = () => setPlaying(false)
      audio.onerror = () => setPlaying(false)
      try {
        await audio.play()
        return
      } catch {
        audioRef.current = null
      }
    }

    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(phrase.alemana || phrase.traductionDe || '')
      utterance.lang = 'de-DE'
      utterance.rate = 0.92
      utterance.onend = () => setPlaying(false)
      utterance.onerror = () => setPlaying(false)
      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
      return
    }

    setPlaying(false)
  }

  return { play, playing }
}

function LessonTopBar({ lesson, streak, onQuit }) {
  return (
    <div className="sticky top-0 z-50 flex h-[52px] items-center justify-between border-b border-[var(--g-light)] bg-white px-4">
      <button type="button" className="border-none bg-transparent text-sm font-semibold text-[var(--gray-400)]" onClick={onQuit}>
        ← Quitter
      </button>
      <span className="truncate px-4 text-center text-[13px] font-semibold text-[var(--g-dark)]">
        {lesson.niveau}-{String(lesson.numero || '').padStart(3, '0')} · {lesson.titre}
      </span>
      <span className="text-[13px] text-[var(--g-mid)]">🔥 {streak}j</span>
    </div>
  )
}

function LessonProgressBar({ current, total }) {
  const safeCurrent = Math.max(0, Math.min(current, total))
  const pct = total <= 0 ? 0 : Math.round((safeCurrent / total) * 100)

  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <div className="h-2 flex-1 overflow-hidden rounded bg-[var(--g-light)]">
        <div className="h-full rounded bg-[var(--g-bright)] transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <span className="min-w-8 text-right text-xs text-[var(--gray-400)]">{safeCurrent}/{total}</span>
    </div>
  )
}

function PhraseCard({ phrase, onNext, onPlayAudio, audioPlaying }) {
  const [showDetails, setShowDetails] = useState(false)
  const chips = detailChips(phrase)

  useEffect(() => {
    setShowDetails(false)
  }, [phrase?.id])

  return (
    <div className="rounded-2xl border border-[var(--g-light)] bg-white p-6 shadow-[0_2px_12px_rgba(0,80,50,0.06)]">
      <div className="space-y-5">
        <div>
          <p className="text-center text-[clamp(1.6rem,5vw,2.2rem)] font-bold leading-tight text-[var(--g-dark)]">
            {phrase.alemana || phrase.traductionDe}
          </p>
          <p className="mt-3 text-center text-[1.1rem] text-[var(--gray-400)]">{phrase.frantsay}</p>
        </div>

        <button
          type="button"
          className="mx-auto block min-h-12 rounded-full border border-[var(--g-light)] bg-[var(--g-pale)] px-6 py-3 text-[15px] font-semibold text-[var(--g-mid)] transition hover:border-[var(--g-bright)] hover:bg-[var(--g-light)]"
          onClick={() => onPlayAudio(phrase)}
        >
          {audioPlaying ? '🔊 Lecture…' : '🔊 Écouter'}
        </button>
      </div>

      <button
        type="button"
        className="mt-4 w-full bg-transparent px-2 py-2 text-center text-xs text-[var(--gray-400)] underline decoration-dotted underline-offset-4"
        onClick={() => setShowDetails((value) => !value)}
      >
        {showDetails ? '▲ Masquer les détails' : '▼ Voir la phonétique et le contexte'}
      </button>

      {showDetails ? (
        <div className="mt-3 space-y-3 rounded-xl bg-[var(--g-pale)] p-4 text-sm text-[var(--gray-600)]">
          {phrase.phonetique ? <p className="font-medium text-[var(--g-dark)]">/{phrase.phonetique}/</p> : null}
          {phrase.registre ? <span className="inline-flex rounded-full bg-[var(--g-light)] px-3 py-1 text-xs font-semibold text-[var(--g-dark)]">Registre : {phrase.registre}</span> : null}
          {phrase.intonation ? <p>🎵 {phrase.intonation}</p> : null}
          {chips.length ? (
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span key={chip} className="rounded-full bg-white px-3 py-1 text-xs text-[var(--gray-600)]">
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        className="mt-6 min-h-12 w-full rounded-xl border-none bg-[var(--g-mid)] px-4 py-3 text-base font-semibold text-white transition hover:bg-[var(--g-dark)] active:scale-[0.98]"
        onClick={onNext}
      >
        Continuer →
      </button>
    </div>
  )
}

function ExerciceCard({ exercice, onCorrect, onNext }) {
  const [selected, setSelected] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [answered, setAnswered] = useState(false)
  const [correct, setCorrect] = useState(false)

  useEffect(() => {
    setSelected(null)
    setInputValue('')
    setAnswered(false)
    setCorrect(false)
  }, [exercice?.id])

  const isChoice = isChoiceExercise(exercice)
  const choices = exerciseChoices(exercice)
  const question = exercisePrompt(exercice)

  const submitAnswer = (value) => {
    if (answered) return
    const ok = evaluateExercise(exercice, value)
    setAnswered(true)
    setCorrect(ok)
    if (isChoice) {
      setSelected(value)
    } else {
      setInputValue(String(value || ''))
    }
    if (ok) onCorrect()
  }

  return (
    <div className="rounded-2xl border border-[var(--g-light)] bg-white p-6 shadow-[0_2px_12px_rgba(0,80,50,0.06)]">
      <p className="text-[clamp(1rem,3.5vw,1.2rem)] font-semibold leading-relaxed text-[var(--g-dark)]">{question}</p>

      {isChoice ? (
        <div className="mt-5 grid gap-3">
          {choices.map((choice, index) => {
            const isCorrectChoice = answered && choice.value === exercice.reponse
            const isWrongChoice = answered && choice.value === selected && !correct
            return (
              <button
                key={choice.id}
                type="button"
                disabled={answered}
                onClick={() => submitAnswer(choice.value)}
                className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                  isCorrectChoice
                    ? 'animate-[pulse-green_0.4s_ease] border-[var(--g-bright)] bg-[var(--g-pale)] text-[var(--g-dark)]'
                    : isWrongChoice
                      ? 'animate-[shake_0.3s_ease] border-red-300 bg-red-50 text-red-700'
                      : 'border-[var(--gray-200)] bg-white text-[var(--near-black)] hover:border-[var(--g-bright)] hover:bg-[var(--g-pale)]'
                }`}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--g-light)] text-xs font-bold text-[var(--g-dark)]">
                  {LETTERS[index]}
                </span>
                <span>{choice.label}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          <input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            disabled={answered}
            placeholder="Écris ta réponse"
            className="min-h-12 w-full rounded-xl border border-[var(--gray-200)] bg-white px-4 py-3 text-sm text-[var(--near-black)] outline-none focus:border-[var(--g-bright)]"
          />
          <button
            type="button"
            className="min-h-12 w-full rounded-xl border border-[var(--g-light)] bg-[var(--g-pale)] px-4 py-3 text-sm font-semibold text-[var(--g-dark)] transition hover:bg-[var(--g-light)]"
            onClick={() => submitAnswer(inputValue)}
            disabled={answered || !inputValue.trim()}
          >
            Valider
          </button>
        </div>
      )}

      {answered ? (
        <div className={`mt-4 rounded-lg border-l-4 px-4 py-3 text-sm ${correct ? 'border-[var(--g-bright)] bg-[var(--g-pale)] text-[var(--g-dark)]' : 'border-red-300 bg-red-50 text-red-700'}`}>
          {correct ? (
            <>✅ <strong>Correct !</strong> +10 XP</>
          ) : (
            <>
              ❌ <strong>Pas tout à fait.</strong>{' '}
              {isChoice ? <>La bonne réponse est : <em>{choices[exercice.reponse]?.label}</em></> : <>Réponse attendue : <em>{exercice.reponse || exercice.answer}</em></>}
            </>
          )}
        </div>
      ) : null}

      {answered && !correct && exercice.explication ? (
        <div className="mt-3 rounded-lg bg-[var(--gray-100)] p-3 text-sm text-[var(--gray-600)]">
          <p>{exercice.explication}</p>
        </div>
      ) : null}

      {answered ? (
        <button
          type="button"
          className="mt-5 min-h-12 w-full rounded-xl border-none bg-[var(--g-mid)] px-4 py-3 text-base font-semibold text-white transition hover:bg-[var(--g-dark)]"
          onClick={onNext}
        >
          {correct ? 'Super, continuer →' : 'Compris, continuer →'}
        </button>
      ) : null}
    </div>
  )
}

function LessonCompleteScreen({ lesson, xpGained, newBadge, onNextLesson, onBackDashboard }) {
  return (
    <div className="rounded-2xl border border-[var(--g-light)] bg-white p-6 text-center shadow-[0_2px_12px_rgba(0,80,50,0.06)]">
      <div className="animate-[bounceIn_0.5s_ease] text-6xl">🎉</div>
      <h2 className="mt-4 text-[1.8rem] font-bold text-[var(--g-dark)]">Leçon terminée !</h2>
      <p className="mt-2 text-base text-[var(--gray-600)]">{lesson.titre}</p>

      <div className="mt-5 inline-block rounded-xl bg-[var(--g-pale)] px-8 py-4 text-[2rem] font-extrabold text-[var(--g-bright)]">
        +{xpGained} XP
      </div>

      {newBadge ? (
        <div className="mt-4 rounded-xl border border-[var(--g-light)] bg-[var(--g-off-white)] px-4 py-3 text-sm text-[var(--g-dark)]">
          🏆 Nouveau badge : <strong>{newBadge}</strong>
        </div>
      ) : null}

      <button
        type="button"
        className="mt-6 min-h-12 w-full rounded-[14px] border-none bg-[var(--g-mid)] px-4 py-4 text-base font-semibold text-white transition hover:bg-[var(--g-dark)]"
        onClick={onNextLesson}
      >
        {lesson.nextTitle ? `Leçon suivante : ${lesson.nextTitle} →` : 'Retour aux leçons →'}
      </button>

      <button
        type="button"
        className="mt-3 border-none bg-transparent text-sm text-[var(--gray-400)]"
        onClick={onBackDashboard}
      >
        ← Retour au tableau de bord
      </button>
    </div>
  )
}

function Lecon() {
  const navigate = useNavigate()
  const { niveau: routeLevel, leconId } = useParams()
  const normalizedLevel = normalizeLevel(routeLevel)
  const { progression, marquerComplete, estComplete } = useProgression()
  const { data: gamification, addXp } = useGamification()

  const lesson = findLessonById(leconId, normalizedLevel)
  const unlockMap = useMemo(
    () => buildLevelUnlockMap(lesson?.niveau || normalizedLevel, progression),
    [lesson?.niveau, normalizedLevel, progression]
  )
  const nextLesson = useMemo(() => (lesson ? findNextLesson(lesson) : null), [lesson])
  const currentState = lesson ? unlockMap.get(lesson.id) : null
  const steps = useMemo(() => buildLessonSteps(lesson?.phrases || [], lesson?.exercices || []), [lesson])
  const displayTotal = Math.max(steps.length - 1, 1)
  const [currentStep, setCurrentStep] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)
  const completionRef = useRef(false)
  const awardedRef = useRef(false)
  const { play, playing } = usePhraseAudio()

  useEffect(() => {
    setCurrentStep(0)
    setXpEarned(0)
    completionRef.current = false
    awardedRef.current = false
  }, [lesson?.id])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep])

  useEffect(() => {
    const step = steps[currentStep]
    if (!lesson || step?.type !== 'complete' || completionRef.current) return

    completionRef.current = true

    ;(async () => {
      const completedBefore = estComplete(lesson.id)
      await marquerComplete(lesson.id, 100)
      if (!completedBefore && lesson.progression?.xp && !awardedRef.current) {
        awardedRef.current = true
        try {
          await addXp(lesson.progression.xp, 'lesson_complete')
        } catch {
          // local completion remains the source of truth
        }
      }
    })()
  }, [addXp, currentStep, estComplete, lesson, marquerComplete, steps])

  if (!lesson) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col justify-center px-4 py-8">
        <div className="rounded-2xl border border-[var(--g-light)] bg-white p-6 text-center shadow-[0_2px_12px_rgba(0,80,50,0.06)]">
          <p className="text-lg font-semibold text-[var(--g-dark)]">Leçon introuvable.</p>
          <button
            type="button"
            onClick={() => navigate('/cours')}
            className="mt-5 min-h-12 w-full rounded-xl bg-[var(--g-mid)] px-4 py-3 font-semibold text-white"
          >
            Retour aux cours
          </button>
        </div>
      </div>
    )
  }

  if (currentState?.unlocked === false && !estComplete(lesson.id)) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col justify-center px-4 py-8">
        <div className="rounded-2xl border border-[var(--g-light)] bg-white p-6 text-center shadow-[0_2px_12px_rgba(0,80,50,0.06)]">
          <p className="text-lg font-semibold text-[var(--g-dark)]">Cette leçon est encore verrouillée.</p>
          <p className="mt-2 text-sm text-[var(--gray-600)]">{currentState.lockedReason}</p>
          <button
            type="button"
            onClick={() => navigate(`/cours/${lesson.niveau}`)}
            className="mt-5 min-h-12 w-full rounded-xl bg-[var(--g-mid)] px-4 py-3 font-semibold text-white"
          >
            Retour au niveau
          </button>
        </div>
      </div>
    )
  }

  const step = steps[currentStep] || steps[steps.length - 1]
  const streak = gamification?.stats?.streakCurrent || 0
  const nextTitle = nextLesson?.titre || ''

  return (
    <div
      className="lesson-focus-layout mx-auto min-h-screen w-full max-w-[520px] px-4 pb-8"
      style={{
        '--g-dark': '#0a5032',
        '--g-mid': '#128c50',
        '--g-bright': '#22c570',
        '--g-light': '#c8f5de',
        '--g-pale': '#e8faf1',
        '--g-off-white': '#f5fdf9',
        '--gray-100': '#e8f0eb',
        '--gray-200': '#c8d8ce',
        '--gray-400': '#7a9888',
        '--gray-600': '#3a5044',
        '--near-black': '#0c1e16',
      }}
    >
      <LessonTopBar lesson={lesson} streak={streak} onQuit={() => navigate(`/cours/${lesson.niveau}`)} />
      <LessonProgressBar current={Math.min(currentStep + 1, displayTotal)} total={displayTotal} />

      <div className="mt-4">
        {step.type === 'phrase' ? (
          <PhraseCard
            phrase={step.data}
            onNext={() => setCurrentStep((value) => Math.min(value + 1, steps.length - 1))}
            onPlayAudio={play}
            audioPlaying={playing}
          />
        ) : null}

        {step.type === 'exercice' ? (
          <ExerciceCard
            exercice={step.data}
            onCorrect={() => setXpEarned((value) => value + 10)}
            onNext={() => setCurrentStep((value) => Math.min(value + 1, steps.length - 1))}
          />
        ) : null}

        {step.type === 'complete' ? (
          <LessonCompleteScreen
            lesson={{ ...lesson, nextTitle }}
            xpGained={xpEarned + (lesson.progression?.xp || 0)}
            newBadge={lesson.progression?.badges?.[0] || null}
            onNextLesson={() => navigate(nextLesson ? `/cours/${nextLesson.niveau}/lecon/${nextLesson.id}` : `/cours/${lesson.niveau}`)}
            onBackDashboard={() => navigate('/dashboard')}
          />
        ) : null}
      </div>
    </div>
  )
}

export default Lecon
