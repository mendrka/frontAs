import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useGamification } from '@context/GamificationContext'
import { useLang } from '@context/LangContext'
import { useProgression } from '@hooks/useProgression'
import {
  buildLevelUnlockMap,
  findLessonById,
  findNextLesson,
  listLevelLessons,
  normalizeLevel,
} from '@data/lessonCatalog'
import AudioPlayer from '@components/cours/AudioPlayer'
import ExerciceBuildPhrase from '@components/cours/ExerciceBuildPhrase'
import ExerciceFillBlank from '@components/cours/ExerciceFillBlank'
import ExerciceHoren from '@components/cours/ExerciceHoren'
import ExerciceMatchPairs from '@components/cours/ExerciceMatchPairs'
import ExerciceOpenAnswer from '@components/cours/ExerciceOpenAnswer'
import ExerciceQCM from '@components/cours/ExerciceQCM'
import ExerciceSprechen from '@components/cours/ExerciceSprechen'
import ExerciceTraduction from '@components/cours/ExerciceTraduction'
import Icon from '@components/ui/Icon'
import { buttonClass, cardClass, cx, levelBadgeClass } from '@utils/ui'

const OBJECTIVE_LABELS = {
  communicatif: 'Objectif communicatif',
  linguistique: 'Point linguistique',
  culturel: 'Repere culturel',
  cognitif: 'Competence cognitive',
}

const INFO_TABS = [
  { key: 'grammar', label: 'Grammaire' },
  { key: 'vocabulary', label: 'Vocabulaire' },
  { key: 'culture', label: 'Culture' },
  { key: 'comprehension', label: 'Comprehension' },
  { key: 'tips', label: 'Astuces' },
]

const EXERCISE_COMPONENTS = {
  qcm: ExerciceQCM,
  fill: ExerciceFillBlank,
  traduction: ExerciceTraduction,
  match: ExerciceMatchPairs,
  build: ExerciceBuildPhrase,
  horen: ExerciceHoren,
  sprechen: ExerciceSprechen,
  open: ExerciceOpenAnswer,
}

function ExerciseRenderer({ exercise, onValide }) {
  const Component = EXERCISE_COMPONENTS[exercise?.type] || ExerciceOpenAnswer
  return <Component data={exercise} onValide={onValide} />
}

function InfoPanel({ tabKey, lesson }) {
  if (tabKey === 'grammar') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {lesson.grammarSections.map((item) => (
          <article key={item.id} className={cx(cardClass.soft, 'p-5')}>
            <h3 className="font-display text-2xl font-semibold tracking-tight text-brand-text">{item.title}</h3>
            {item.body ? <p className="mt-3 text-sm leading-relaxed text-brand-brown sm:text-base">{item.body}</p> : null}
            {item.bullets?.length ? (
              <div className="mt-4 space-y-2 text-sm text-brand-brown">
                {item.bullets.map((bullet) => (
                  <div key={bullet} className="rounded-2xl bg-white/80 px-4 py-3">
                    {bullet}
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    )
  }

  if (tabKey === 'vocabulary') {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {lesson.vocabulary.map((item) => (
          <article key={item.id} className={cx(cardClass.soft, 'p-5')}>
            <p className="section-kicker">{item.type || 'Lexique'}</p>
            <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-brand-text">{item.de}</h3>
            <p className="mt-2 text-base text-brand-brown">{item.fr}</p>
            {item.phonetique ? <p className="mt-3 text-sm text-brand-brown/80">/{item.phonetique}/</p> : null}
            {item.note ? <p className="mt-3 text-sm leading-relaxed text-brand-brown">{item.note}</p> : null}
          </article>
        ))}
      </div>
    )
  }

  const items =
    tabKey === 'culture'
      ? lesson.cultureNotes
      : tabKey === 'comprehension'
        ? lesson.comprehensionChecks
        : lesson.tipCards

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((item) => (
        <article key={item.id} className={cx(cardClass.soft, 'p-5')}>
          <p className="section-kicker">{INFO_TABS.find((tab) => tab.key === tabKey)?.label}</p>
          <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-brand-text">{item.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-brand-brown sm:text-base">{item.body}</p>
        </article>
      ))}
    </div>
  )
}

function LessonHeroSection({ lesson, currentLessonState, nextLesson, nextLessonState, isComplete, t }) {
  return (
    <>
      <section className={cx(cardClass.base, 'overflow-hidden p-6 sm:p-8')}>
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <span className={levelBadgeClass(lesson.niveau)}>
              {lesson.niveau} · {lesson.id.toUpperCase()}
            </span>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-brand-text sm:text-5xl">
              {lesson.titre}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-brand-brown sm:text-lg">
              {lesson.description}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {lesson.module ? (
                <span className="stat-chip">
                  <Icon name="book" size={15} className="icon" />
                  {lesson.module}
                </span>
              ) : null}
              <span className="stat-chip">
                <Icon name="clock" size={15} className="icon" />
                {lesson.duree || 0} min
              </span>
              <span className="stat-chip">
                <Icon name="translate" size={15} className="icon" />
                {lesson.phrasesCount || 0} {t('Phrasen', 'phrases')}
              </span>
              <span className="stat-chip">
                <Icon name="checkCircle" size={15} className="icon" />
                {lesson.exercicesCount || 0} {t('Uebungen', 'exercices')}
              </span>
            </div>

            {currentLessonState?.unlocked === false ? (
              <div className="mt-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
                <strong>{t('Gesperrte Lektion', 'Lecon verrouillee')}:</strong> {currentLessonState.lockedReason}
              </div>
            ) : null}
          </div>

          <aside className={cx(cardClass.soft, 'p-5')}>
            <p className="section-kicker">{t('Fortschritt', 'Progression')}</p>
            <div className="mt-4 space-y-4">
              <div className="rounded-[1.5rem] bg-white/80 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-brand-brown">XP</p>
                <p className="mt-2 font-display text-3xl font-semibold text-brand-text">{lesson.progression?.xp || 0}</p>
              </div>
              <div className="rounded-[1.5rem] bg-white/80 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-brand-brown">{t('Status', 'Statut')}</p>
                <p className="mt-2 font-display text-2xl font-semibold text-brand-text">
                  {isComplete ? t('Bereits abgeschlossen', 'Deja terminee') : t('In Arbeit', 'En cours')}
                </p>
              </div>
            </div>

            {lesson.progression?.badges?.length ? (
              <div className="mt-5">
                <p className="text-sm uppercase tracking-[0.2em] text-brand-brown">{t('Badges', 'Badges')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {lesson.progression.badges.map((badge) => (
                    <span key={badge} className="rounded-full border border-brand-border/80 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-brown">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {nextLesson ? (
              <div className="mt-6 rounded-[1.5rem] border border-brand-border/80 bg-white/80 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-brand-brown">{t('Naechste Lektion', 'Prochaine lecon')}</p>
                <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-brand-text">{nextLesson.titre}</h2>
                <p className="mt-2 text-sm leading-relaxed text-brand-brown">
                  {lesson.progression?.nextPreview || nextLesson.description}
                </p>
                {nextLessonState?.unlocked ? (
                  <Link className={cx(buttonClass.outline, 'mt-4 w-full justify-center')} to={`/cours/${nextLesson.niveau}/lecon/${nextLesson.id}`}>
                    <Icon name="arrowRight" size={18} className="icon" />
                    {t('Weiter', 'Suivante')}
                  </Link>
                ) : (
                  <div className={cx(buttonClass.ghost, 'mt-4 w-full cursor-not-allowed justify-center')}>
                    <Icon name="lock" size={18} className="icon" />
                    {nextLessonState?.lockedReason || t('Noch blockiert', 'Encore verrouillee')}
                  </div>
                )}
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {Object.entries(lesson.objectives || {}).map(([key, value]) => (
          <article key={key} className={cx(cardClass.soft, 'p-5')}>
            <p className="section-kicker">{OBJECTIVE_LABELS[key] || key}</p>
            <p className="mt-3 text-sm leading-relaxed text-brand-brown sm:text-base">{value}</p>
          </article>
        ))}
      </section>
    </>
  )
}

function LessonPhrasesSection({
  lesson,
  phrases,
  activePhraseIndex,
  setActivePhraseIndex,
  currentPhrase,
  t,
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className={cx(cardClass.base, 'p-6 sm:p-8')}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-kicker">{t('Dialog', 'Phrases')}</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-brand-text">
              {t('Phrase fuer Phrase', 'Phrase par phrase')}
            </h2>
          </div>

          {phrases.length > 1 ? (
            <div className="flex items-center gap-3">
              <button
                className={buttonClass.ghost}
                disabled={activePhraseIndex === 0}
                onClick={() => setActivePhraseIndex((value) => Math.max(0, value - 1))}
                type="button"
              >
                <Icon name="arrowLeft" size={18} className="icon" />
                {t('Zurueck', 'Avant')}
              </button>
              <span className="text-sm font-semibold text-brand-brown">
                {activePhraseIndex + 1}/{phrases.length}
              </span>
              <button
                className={buttonClass.ghost}
                disabled={activePhraseIndex === phrases.length - 1}
                onClick={() => setActivePhraseIndex((value) => Math.min(phrases.length - 1, value + 1))}
                type="button"
              >
                {t('Weiter', 'Apres')}
                <Icon name="arrowRight" size={18} className="icon" />
              </button>
            </div>
          ) : null}
        </div>

        {currentPhrase ? (
          <div className="mt-6 rounded-[1.8rem] border border-brand-border/80 bg-brand-sky/45 p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue">Deutsch</p>
                <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-brand-text">
                  {currentPhrase.alemana}
                </p>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue">Francais</p>
                <p className="mt-3 text-base leading-relaxed text-brand-brown sm:text-lg">{currentPhrase.frantsay}</p>
                {currentPhrase.phonetique ? (
                  <p className="mt-4 text-sm text-brand-brown/80">/{currentPhrase.phonetique}/</p>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-col gap-3">
                <AudioPlayer texte={currentPhrase.audio || currentPhrase.alemana} langue="de-DE" />
                {currentPhrase.audioUrl ? (
                  <span className="rounded-full border border-brand-border/80 bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-brown">
                    {currentPhrase.audioUrl}
                  </span>
                ) : null}
              </div>
            </div>

            {(currentPhrase.registre || currentPhrase.intonation) ? (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {currentPhrase.registre ? (
                  <div className="rounded-[1.4rem] bg-white/80 p-4 text-sm text-brand-brown">
                    <strong className="text-brand-text">Registre:</strong> {currentPhrase.registre}
                  </div>
                ) : null}
                {currentPhrase.intonation ? (
                  <div className="rounded-[1.4rem] bg-white/80 p-4 text-sm text-brand-brown">
                    <strong className="text-brand-text">Intonation:</strong> {currentPhrase.intonation}
                  </div>
                ) : null}
              </div>
            ) : null}

            {currentPhrase.notes?.length ? (
              <div className="mt-5 space-y-2 text-sm text-brand-brown">
                {currentPhrase.notes.map((note) => (
                  <div key={note} className="rounded-[1.4rem] bg-white/80 px-4 py-3">
                    {note}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-6 rounded-[1.6rem] border border-dashed border-brand-border/80 px-5 py-10 text-center text-brand-brown">
            {t('Keine Dialogkarte fuer diese Lektion.', 'Aucune phrase dialogue pour cette lecon.')}
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <article className={cx(cardClass.soft, 'p-5')}>
          <p className="section-kicker">{t('Situation', 'Situation')}</p>
          <div className="mt-4 space-y-3 text-sm text-brand-brown">
            {lesson.intro?.contexte ? <p><strong className="text-brand-text">Contexte:</strong> {lesson.intro.contexte}</p> : null}
            {lesson.intro?.lieu ? <p><strong className="text-brand-text">Lieu:</strong> {lesson.intro.lieu}</p> : null}
            {lesson.intro?.type ? <p><strong className="text-brand-text">Type:</strong> {lesson.intro.type}</p> : null}
            {lesson.intro?.registre ? <p><strong className="text-brand-text">Registre:</strong> {lesson.intro.registre}</p> : null}
          </div>
        </article>

        {lesson.prerequisites?.length ? (
          <article className={cx(cardClass.soft, 'p-5')}>
            <p className="section-kicker">{t('Prerequis', 'Prerequis')}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {lesson.prerequisites.map((item) => {
                const prerequisiteLesson = findLessonById(item)
                if (!prerequisiteLesson) {
                  return (
                    <span key={item} className="rounded-full border border-brand-border/80 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-brown">
                      {item.toUpperCase()}
                    </span>
                  )
                }

                return (
                  <Link
                    key={item}
                    className="rounded-full border border-brand-border/80 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-brown transition hover:border-brand-blue/40 hover:bg-brand-sky/60"
                    to={`/cours/${prerequisiteLesson.niveau}/lecon/${prerequisiteLesson.id}`}
                  >
                    {item.toUpperCase()}
                  </Link>
                )
              })}
            </div>
          </article>
        ) : null}

        {lesson.skills?.length ? (
          <article className={cx(cardClass.soft, 'p-5')}>
            <p className="section-kicker">{t('Competences', 'Competences')}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {lesson.skills.map((item) => (
                <span key={item} className="rounded-full border border-brand-border/80 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-brown">
                  {item}
                </span>
              ))}
            </div>
          </article>
        ) : null}

        {lesson.crossThemes?.length ? (
          <article className={cx(cardClass.soft, 'p-5')}>
            <p className="section-kicker">{t('Themes', 'Themes')}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {lesson.crossThemes.map((item) => (
                <span key={item} className="rounded-full border border-brand-border/80 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-brown">
                  {item}
                </span>
              ))}
            </div>
          </article>
        ) : null}
      </aside>
    </section>
  )
}

function LessonTabsSection({ availableTabs, activeTab, setActiveTab, lesson, t }) {
  if (!availableTabs.length) return null

  return (
    <section className={cx(cardClass.base, 'p-6 sm:p-8')}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="section-kicker">{t('Erklaerungen', 'Explications')}</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-brand-text">
            {t('Inhalte der Lektion', 'Contenu pedagogique')}
          </h2>
        </div>

        <div className="flex flex-wrap gap-3">
          {availableTabs.map((tab) => (
            <button
              key={tab.key}
              className={cx(
                'rounded-full border px-4 py-2 text-sm font-semibold transition',
                activeTab === tab.key
                  ? 'border-brand-blue bg-brand-blue text-white shadow-soft'
                  : 'border-brand-border bg-white/80 text-brand-text hover:border-brand-blue/40 hover:bg-brand-sky/60'
              )}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <InfoPanel tabKey={activeTab} lesson={lesson} />
      </div>
    </section>
  )
}

function LessonExercisesSection({
  lesson,
  exercises,
  exerciseIndex,
  currentExercise,
  currentResult,
  answeredCount,
  correctCount,
  score,
  handleExerciseValidated,
  handleExerciseContinue,
  handleExerciseRestart,
  nextLesson,
  nextLessonState,
  t,
}) {
  return (
    <section className={cx(cardClass.base, 'p-6 sm:p-8')}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="section-kicker">{t('Uebungen', 'Exercices')}</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-brand-text">
            {t('Normalisierte Aktivitaeten', 'Activites normalisees')}
          </h2>
        </div>

        <div className="w-full max-w-xs">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${exercises.length ? Math.round((answeredCount / exercises.length) * 100) : 0}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-brand-brown">
            <span>{answeredCount}/{exercises.length}</span>
            <span>{score}%</span>
          </div>
        </div>
      </div>

      {currentExercise ? (
        <div className="mt-6 space-y-5">
          <div className={cx(cardClass.soft, 'p-4')}>
            <div className="flex flex-wrap items-center gap-3 text-sm text-brand-brown">
              <span className="rounded-full border border-brand-border/80 bg-white/80 px-3 py-1 font-semibold uppercase tracking-[0.18em]">
                {t('Schritt', 'Etape')} {exerciseIndex + 1}
              </span>
              <span className="rounded-full border border-brand-border/80 bg-white/80 px-3 py-1 font-semibold uppercase tracking-[0.18em]">
                {currentExercise.type}
              </span>
            </div>
          </div>

          {!currentResult ? (
            <ExerciseRenderer exercise={currentExercise} onValide={handleExerciseValidated} />
          ) : (
            <div className={cx(cardClass.soft, 'p-6')}>
              <p className="section-kicker">{t('Antwort gespeichert', 'Reponse enregistree')}</p>
              <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-brand-text">
                {currentResult.correct ? t('Correct', 'Correct') : t('A revoir', 'A revoir')}
              </h3>
              <div className="mt-4 space-y-3 text-sm text-brand-brown">
                {currentResult.payload?.userAnswer ? (
                  <p><strong className="text-brand-text">{t('Deine Antwort', 'Ta reponse')}:</strong> {currentResult.payload.userAnswer}</p>
                ) : null}
                {currentResult.payload?.expectedAnswer ? (
                  <p><strong className="text-brand-text">{t('Erwartet', 'Attendu')}:</strong> {currentResult.payload.expectedAnswer}</p>
                ) : null}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {exerciseIndex < exercises.length - 1 ? (
                  <button className={buttonClass.primary} onClick={handleExerciseContinue} type="button">
                    <Icon name="arrowRight" size={18} className="icon" />
                    {t('Weiter zur naechsten Frage', 'Question suivante')}
                  </button>
                ) : (
                  <button className={buttonClass.primary} onClick={handleExerciseContinue} type="button">
                    <Icon name="checkCircle" size={18} className="icon" />
                    {t('Zusammenfassung sehen', 'Voir le bilan')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-[1.8rem] border border-brand-border/80 bg-brand-sky/45 p-6 sm:p-8">
          <p className="section-kicker">{t('Bilan', 'Bilan')}</p>
          <h3 className="mt-3 font-display text-3xl font-semibold tracking-tight text-brand-text">
            {t('Lektion abgeschlossen', 'Lecon terminee')}
          </h3>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-brand-brown">
            {t(
              'Die Uebungen wurden ueber die lokale Normalisierung geladen und dein Ergebnis wurde in der lokalen Progression gespeichert.',
              'Les exercices ont ete charges via la normalisation locale et ton resultat a ete enregistre dans la progression locale.'
            )}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className={cx(cardClass.soft, 'p-4')}>
              <p className="text-sm uppercase tracking-[0.2em] text-brand-brown">Score</p>
              <p className="mt-2 font-display text-3xl font-semibold text-brand-text">{score}%</p>
            </div>
            <div className={cx(cardClass.soft, 'p-4')}>
              <p className="text-sm uppercase tracking-[0.2em] text-brand-brown">{t('Richtig', 'Correctes')}</p>
              <p className="mt-2 font-display text-3xl font-semibold text-brand-text">{correctCount}</p>
            </div>
            <div className={cx(cardClass.soft, 'p-4')}>
              <p className="text-sm uppercase tracking-[0.2em] text-brand-brown">XP</p>
              <p className="mt-2 font-display text-3xl font-semibold text-brand-text">{lesson.progression?.xp || 0}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button className={buttonClass.outline} onClick={handleExerciseRestart} type="button">
              <Icon name="refresh" size={18} className="icon" />
              {t('Uebungen neu starten', 'Recommencer les exercices')}
            </button>

            {nextLesson && nextLessonState?.unlocked ? (
              <Link className={buttonClass.primary} to={`/cours/${nextLesson.niveau}/lecon/${nextLesson.id}`}>
                <Icon name="arrowRight" size={18} className="icon" />
                {t('Zur naechsten Lektion', 'Vers la lecon suivante')}
              </Link>
            ) : (
              <Link className={buttonClass.primary} to={`/cours/${lesson.niveau}`}>
                <Icon name="book" size={18} className="icon" />
                {t('Zurueck zur Liste', 'Retour a la liste')}
              </Link>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function LessonJourneySection({ lesson, levelLessons, unlockMap, t }) {
  if (levelLessons.length <= 1) return null

  return (
    <section className={cx(cardClass.base, 'p-6 sm:p-8')}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="section-kicker">{lesson.niveau}</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-brand-text">
            {t('Parcours du niveau', 'Parcours du niveau')}
          </h2>
        </div>
        <Link className={buttonClass.outline} to={`/cours/${lesson.niveau}`}>
          <Icon name="arrowLeft" size={18} className="icon" />
          {t('Voir toutes les lecons', 'Voir toutes les lecons')}
        </Link>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {levelLessons.map((item) => {
          const state = unlockMap.get(item.id)
          const active = item.id === lesson.id
          return (
            <article
              key={item.id}
              className={cx(
                cardClass.soft,
                'p-4',
                active && 'border-brand-blue/40 bg-brand-sky/60'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-blue">{item.id.toUpperCase()}</p>
                  <h3 className="mt-2 font-display text-xl font-semibold tracking-tight text-brand-text">{item.titre}</h3>
                </div>
                {active ? (
                  <span className="rounded-full border border-brand-blue/30 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-blue">
                    {t('Aktuell', 'Actuelle')}
                  </span>
                ) : state?.unlocked ? (
                  <Link className={buttonClass.outline} to={`/cours/${item.niveau}/lecon/${item.id}`}>
                    {t('Oeffnen', 'Ouvrir')}
                  </Link>
                ) : (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                    {t('Gesperrt', 'Bloquee')}
                  </span>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function Lecon() {
  const { niveau: routeLevel, leconId } = useParams()
  const navigate = useNavigate()
  const { t } = useLang()
  const { progression, marquerComplete, estComplete } = useProgression()
  const { addXp } = useGamification()

  const normalizedLevel = normalizeLevel(routeLevel)
  const lesson = findLessonById(leconId, normalizedLevel)
  const levelLessons = listLevelLessons(lesson?.niveau || normalizedLevel)
  const unlockMap = useMemo(
    () => buildLevelUnlockMap(lesson?.niveau || normalizedLevel, progression),
    [lesson?.niveau, normalizedLevel, progression]
  )
  const nextLesson = lesson ? findNextLesson(lesson) : null
  const nextLessonState = useMemo(() => {
    if (!nextLesson) return null
    if (nextLesson.niveau === lesson?.niveau) return unlockMap.get(nextLesson.id)
    return buildLevelUnlockMap(nextLesson.niveau, progression).get(nextLesson.id)
  }, [lesson?.niveau, nextLesson, progression, unlockMap])

  const [activePhraseIndex, setActivePhraseIndex] = useState(0)
  const [activeTab, setActiveTab] = useState('grammar')
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [results, setResults] = useState({})

  const completionTriggeredRef = useRef(false)
  const xpAwardedRef = useRef(false)
  const alreadyCompleteRef = useRef(false)

  const phrases = lesson?.phrases || []
  const exercises = lesson?.exercices || []
  const currentPhrase = phrases[activePhraseIndex] || null
  const currentExercise = exercises[exerciseIndex] || null
  const currentResult = currentExercise ? results[currentExercise.id] : null
  const answeredCount = Object.keys(results).length
  const correctCount = Object.values(results).filter((item) => item.correct).length
  const score = exercises.length ? Math.round((correctCount / exercises.length) * 100) : 100
  const currentLessonState = lesson ? unlockMap.get(lesson.id) : null
  const isComplete = lesson ? estComplete(lesson.id) : false

  const availableTabs = INFO_TABS.filter((tab) => {
    if (!lesson) return false
    if (tab.key === 'grammar') return lesson.grammarSections?.length
    if (tab.key === 'vocabulary') return lesson.vocabulary?.length
    if (tab.key === 'culture') return lesson.cultureNotes?.length
    if (tab.key === 'comprehension') return lesson.comprehensionChecks?.length
    return lesson.tipCards?.length
  })

  useEffect(() => {
    if (!lesson) return
    setActivePhraseIndex(0)
    setExerciseIndex(0)
    setResults({})
    setActiveTab(availableTabs[0]?.key || 'grammar')
    completionTriggeredRef.current = false
    xpAwardedRef.current = false
    alreadyCompleteRef.current = estComplete(lesson.id)
  }, [lesson?.id])

  useEffect(() => {
    if (!lesson || completionTriggeredRef.current) return
    if (!exercises.length || answeredCount !== exercises.length) return

    completionTriggeredRef.current = true

    ;(async () => {
      await marquerComplete(lesson.id, score)
      if (!alreadyCompleteRef.current && lesson.progression?.xp && !xpAwardedRef.current) {
        xpAwardedRef.current = true
        try {
          await addXp(lesson.progression.xp, 'lesson_complete')
        } catch {
          // Keep local completion even if remote XP sync fails.
        }
      }
    })()
  }, [addXp, answeredCount, exercises.length, lesson, marquerComplete, score])

  const handleExerciseValidated = (correct, payload) => {
    if (!currentExercise) return
    setResults((prev) => {
      if (prev[currentExercise.id]) return prev
      return {
        ...prev,
        [currentExercise.id]: {
          correct,
          payload,
        },
      }
    })
  }

  const handleExerciseContinue = () => {
    if (!currentExercise) return
    setExerciseIndex((value) => Math.min(value + 1, exercises.length))
  }

  const handleExerciseRestart = () => {
    setExerciseIndex(0)
    setResults({})
    completionTriggeredRef.current = false
    xpAwardedRef.current = false
    alreadyCompleteRef.current = lesson ? estComplete(lesson.id) : false
  }

  if (!lesson) {
    return (
      <div className={cx(cardClass.base, 'p-8 text-center')}>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-sky text-brand-blue">
          <Icon name="warning" size={28} className="icon" />
        </div>
        <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight text-brand-text">
          {t('Lektion nicht gefunden', 'Lecon introuvable')}
        </h1>
        <p className="mt-3 text-brand-brown">
          {t('Diese Lektion existiert nicht in der lokalen Bibliothek.', "Cette lecon n'existe pas dans la bibliotheque locale.")}
        </p>
        <button className={cx(buttonClass.outline, 'mt-6')} onClick={() => navigate('/cours')} type="button">
          <Icon name="arrowLeft" size={18} className="icon" />
          {t('Zurueck zu den Kursen', 'Retour aux cours')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <LessonHeroSection
        currentLessonState={currentLessonState}
        isComplete={isComplete}
        lesson={lesson}
        nextLesson={nextLesson}
        nextLessonState={nextLessonState}
        t={t}
      />

      <LessonPhrasesSection
        activePhraseIndex={activePhraseIndex}
        currentPhrase={currentPhrase}
        lesson={lesson}
        phrases={phrases}
        setActivePhraseIndex={setActivePhraseIndex}
        t={t}
      />

      <LessonTabsSection
        activeTab={activeTab}
        availableTabs={availableTabs}
        lesson={lesson}
        setActiveTab={setActiveTab}
        t={t}
      />

      <LessonExercisesSection
        answeredCount={answeredCount}
        correctCount={correctCount}
        currentExercise={currentExercise}
        currentResult={currentResult}
        exerciseIndex={exerciseIndex}
        exercises={exercises}
        handleExerciseContinue={handleExerciseContinue}
        handleExerciseRestart={handleExerciseRestart}
        handleExerciseValidated={handleExerciseValidated}
        lesson={lesson}
        nextLesson={nextLesson}
        nextLessonState={nextLessonState}
        score={score}
        t={t}
      />

      <LessonJourneySection lesson={lesson} levelLessons={levelLessons} t={t} unlockMap={unlockMap} />
    </div>
  )
}

export default Lecon
