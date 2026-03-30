import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import { useLang } from '@context/LangContext'
import { useProgression } from '@hooks/useProgression'
import {
  buildLevelUnlockMap,
  findNextRecommendedLesson,
  getCatalogStats,
  listAvailableLevels,
  listLevelLessons,
  normalizeLevel,
} from '@data/lessonCatalog'
import Icon from '@components/ui/Icon'
import { buttonClass, cardClass, cx, levelBadgeClass } from '@utils/ui'

const LEVEL_COPY = {
  A1: 'Bases utiles pour se presenter, saluer et gerer les situations du quotidien.',
  A2: 'Vie pratique, echanges simples et autonomie progressive en allemand.',
  B1: 'Travail, integration et expression plus fluide dans des contextes reels.',
  B2: 'Communication pro, argumentation et contenus plus riches.',
  C1: 'Contenu avance disponible plus tard.',
  C2: 'Contenu expert disponible plus tard.',
}

function Cours() {
  const { niveau: routeLevel } = useParams()
  const { user } = useAuth()
  const { t } = useLang()
  const { progression, estComplete, getScore, getProgressionNiveau } = useProgression()

  const levels = listAvailableLevels()
  const userLevel = normalizeLevel(user?.niveau)
  const selectedLevel = normalizeLevel(routeLevel) || userLevel || levels[0] || null
  const lessons = listLevelLessons(selectedLevel)
  const unlockMap = useMemo(() => buildLevelUnlockMap(selectedLevel, progression), [progression, selectedLevel])
  const catalogStats = getCatalogStats()
  const progressValue = getProgressionNiveau(lessons.map((lesson) => lesson.id))
  const completedLessons = lessons.filter((lesson) => estComplete(lesson.id)).length
  const nextLesson = findNextRecommendedLesson(selectedLevel, progression)

  const levelSummaries = useMemo(() => {
    return levels.map((level) => {
      const levelLessons = listLevelLessons(level)
      return {
        level,
        lessons: levelLessons.length,
        completed: levelLessons.filter((lesson) => estComplete(lesson.id)).length,
        progress: getProgressionNiveau(levelLessons.map((lesson) => lesson.id)),
      }
    })
  }, [estComplete, getProgressionNiveau, levels])

  if (!selectedLevel) {
    return (
      <div className={cx(cardClass.base, 'p-8')}>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-brand-text">
          {t('Keine Lektionen gefunden', 'Aucune lecon disponible')}
        </h1>
        <p className="mt-3 text-brand-brown">
          {t('Bitte pruefe die lokale Bibliothek.', 'Verifie le contenu local des lecons.')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className={cx(cardClass.base, 'overflow-hidden p-6 sm:p-8')}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <p className="section-kicker">{t('Kursbibliothek', 'Bibliotheque locale')}</p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-brand-text sm:text-4xl">
              {t('Lektionen direkt aus der lokalen Bibliothek', 'Lecons chargees directement depuis les fichiers locaux')}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-brand-brown sm:hidden">
              {t(
                'Le catalogue mobile montre surtout le niveau, la progression et la prochaine action.',
                'Sur mobile, le catalogue montre surtout le niveau, la progression et la prochaine action.'
              )}
            </p>
            <p className="mt-4 hidden max-w-3xl text-base leading-relaxed text-brand-brown sm:block sm:text-lg">
              {t(
                'Diese Seite nutzt nicht mehr die alte API-Kette. Die Lektionen werden aus der lokalen Bibliothek normalisiert und direkt in der UI angezeigt.',
                "Cette page n'utilise plus l'ancien flux API/cache pour les lecons. Le contenu local est normalise puis affiche directement."
              )}
            </p>
            <details className="mt-4 rounded-[1.2rem] border border-white/75 bg-white/72 p-4 text-sm text-brand-brown shadow-sm sm:hidden">
              <summary className="cursor-pointer list-none font-semibold text-brand-text">
                {t('Mehr Kontext anzeigen', 'Afficher le contexte')}
              </summary>
              <p className="mt-3 leading-7">
                {t(
                  'Die Lektionen kommen direkt aus der lokalen Bibliothek. Die detailreicheren Beschreibungen bleiben auf Abruf, damit der mobile Bildschirm sauber bleibt.',
                  'Les lecons viennent directement de la bibliotheque locale. Les details restent a la demande pour garder un ecran mobile propre.'
                )}
              </p>
            </details>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="stat-chip">
                <Icon name="book" size={16} className="icon" />
                {catalogStats.lessons} {t('Lektionen', 'lecons')}
              </span>
              <span className="stat-chip">
                <Icon name="translate" size={16} className="icon" />
                {catalogStats.phrases} {t('Satzkarten', 'phrases')}
              </span>
              <span className="stat-chip">
                <Icon name="checkCircle" size={16} className="icon" />
                {catalogStats.exercises} {t('Uebungen', 'exercices')}
              </span>
            </div>
          </div>

          <div className={cx(cardClass.soft, 'p-5')}>
            <p className="section-kicker">{selectedLevel}</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-brand-text">
              {t('Aktiver Fokus', 'Niveau actif')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-brown">
              {LEVEL_COPY[selectedLevel] || LEVEL_COPY.A1}
            </p>

            <div className="mt-5 progress-track">
              <div className="progress-fill" style={{ width: `${progressValue}%` }} />
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-brand-brown">
              <span>{completedLessons}/{lessons.length} {t('erledigt', 'terminees')}</span>
              <span>{progressValue}%</span>
            </div>

            {nextLesson ? (
              <Link
                className={cx(buttonClass.primary, 'mt-5 w-full justify-center')}
                to={`/cours/${nextLesson.niveau}/lecon/${nextLesson.id}`}
              >
                <Icon name="arrowRight" size={18} className="icon" />
                {t('Naechste Lektion', 'Prochaine lecon')}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className={cx(cardClass.base, 'p-5 sm:p-6')}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-kicker">{t('Filter', 'Filtre')}</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-brand-text">
              {t('Niveau waehlen', 'Choisis un niveau')}
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            {levelSummaries.map((item) => {
              const active = item.level === selectedLevel
              return (
                <Link
                  key={item.level}
                  className={cx(
                    'rounded-full border px-4 py-2 text-sm font-semibold transition',
                    active
                      ? 'border-brand-blue bg-brand-blue text-white shadow-soft'
                      : 'border-brand-border bg-white/80 text-brand-text hover:border-brand-blue/40 hover:bg-brand-sky/60'
                  )}
                  to={`/cours/${item.level}`}
                >
                  {item.level} · {item.completed}/{item.lessons}
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-kicker">{selectedLevel}</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-brand-text">
              {t('Lokale Lektionen', 'Lecons du niveau')}
            </h2>
          </div>
          <p className="text-sm text-brand-brown">
            {lessons.length} {t('verfuegbar', 'disponibles')}
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {lessons.map((lesson) => {
            const lessonState = unlockMap.get(lesson.id) || { unlocked: false, lockedReason: null }
            const complete = estComplete(lesson.id)
            const score = getScore(lesson.id)

            return (
              <article
                key={lesson.id}
                className={cx(
                  complete || lessonState.unlocked ? cardClass.interactive : cardClass.base,
                  'overflow-hidden p-5 sm:p-6',
                  !lessonState.unlocked && !complete && 'opacity-85'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className={levelBadgeClass(lesson.niveau)}>
                      {lesson.niveau} · {lesson.id.toUpperCase()}
                    </span>
                    <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight text-brand-text">
                      {lesson.titre}
                    </h3>
                    <p className="mt-3 hidden text-sm leading-relaxed text-brand-brown sm:block sm:text-base">
                      {lesson.description}
                    </p>
                    <details className="mt-4 rounded-[1.2rem] border border-brand-border/70 bg-white/72 p-3 text-sm text-brand-brown shadow-sm sm:hidden">
                      <summary className="cursor-pointer list-none font-semibold text-brand-text">
                        {t('Kontext anzeigen', 'Voir le contexte')}
                      </summary>
                      <p className="mt-3 leading-relaxed">{lesson.description}</p>
                    </details>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {complete ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                        {t('Fertig', 'Terminee')}
                      </span>
                    ) : lessonState.unlocked ? (
                      <span className="rounded-full border border-brand-blue/20 bg-brand-sky/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-blue">
                        {t('Offen', 'Ouverte')}
                      </span>
                    ) : (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                        {t('Gesperrt', 'Bloquee')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 text-sm text-brand-brown">
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
                  {lesson.progression?.xp ? (
                    <span className="stat-chip">
                      <Icon name="bolt" size={15} className="icon" />
                      {lesson.progression.xp} XP
                    </span>
                  ) : null}
                </div>

                {lesson.skills?.length ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {lesson.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-brand-border/80 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-brown"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-brand-brown">
                    {score != null ? (
                      <span>{t('Letzter Score', 'Dernier score')}: <strong className="text-brand-text">{score}%</strong></span>
                    ) : lessonState.lockedReason ? (
                      <span>{lessonState.lockedReason}</span>
                    ) : (
                      <span>{t('Bereit zum Lernen', 'Pret a etudier')}</span>
                    )}
                  </div>

                  {complete || lessonState.unlocked ? (
                    <Link className={buttonClass.outline} to={`/cours/${lesson.niveau}/lecon/${lesson.id}`}>
                      <Icon name="book" size={18} className="icon" />
                      {complete ? t('Wiederholen', 'Revoir') : t('Oeffnen', 'Ouvrir')}
                    </Link>
                  ) : (
                    <div className={cx(buttonClass.ghost, 'cursor-not-allowed justify-center')}>
                      <Icon name="lock" size={18} className="icon" />
                      {t('Warte noch', 'Pas encore')}
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default Cours
