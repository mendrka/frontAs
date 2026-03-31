import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import { useLang } from '@context/LangContext'
import { useProgression } from '@hooks/useProgression'
import XPBar from '@components/dashboard/XPBar'
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

function Dashboard() {
  const { user } = useAuth()
  const { t } = useLang()
  const { progression, estComplete, getProgressionNiveau } = useProgression()

  const levels = listAvailableLevels()
  const preferredLevel = normalizeLevel(user?.niveau) || levels[0] || null
  const nextLesson = findNextRecommendedLesson(preferredLevel, progression)
  const catalogStats = getCatalogStats()

  const completedLessons = useMemo(() => {
    return levels.reduce((sum, level) => {
      return sum + listLevelLessons(level).filter((lesson) => estComplete(lesson.id)).length
    }, 0)
  }, [estComplete, levels])

  const completedMinutes = useMemo(() => {
    return levels.reduce((sum, level) => {
      return sum + listLevelLessons(level)
        .filter((lesson) => estComplete(lesson.id))
        .reduce((levelSum, lesson) => levelSum + (lesson.duree || 0), 0)
    }, 0)
  }, [estComplete, levels])

  const levelSummaries = useMemo(() => {
    return levels.map((level) => {
      const lessons = listLevelLessons(level)
      const unlockMap = buildLevelUnlockMap(level, progression)
      const nextInLevel = lessons.find((lesson) => {
        const state = unlockMap.get(lesson.id)
        return state?.unlocked && !state?.complete
      })

      return {
        level,
        total: lessons.length,
        completed: lessons.filter((lesson) => estComplete(lesson.id)).length,
        progress: getProgressionNiveau(lessons.map((lesson) => lesson.id)),
        nextInLevel,
      }
    })
  }, [estComplete, getProgressionNiveau, levels, progression])

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className={cx(cardClass.base, 'overflow-hidden p-4 sm:p-8')}>
        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-6">
          <div>
            <p className="section-kicker">{t('Dashboard', 'Tableau de bord')}</p>
            <h1 className="mt-3 font-display text-[clamp(2rem,1.6rem+1.4vw,2.75rem)] font-semibold tracking-tight text-brand-text">
              {t('Willkommen zurueck', 'Bon retour')}{user?.prenom ? `, ${user.prenom}` : ''}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-brand-brown sm:text-lg sm:leading-relaxed">
              {t(
                'Das Dashboard bleibt auf die naechste Aktion und die Kennzahlen fokussiert.',
                'Le dashboard reste concentre sur la prochaine action et les chiffres utiles.'
              )}
            </p>
            <details className="mt-4 max-w-2xl rounded-[1.35rem] border border-white/75 bg-white/72 p-4 text-sm text-brand-brown shadow-sm">
              <summary className="cursor-pointer list-none font-semibold text-brand-text">
                {t('Mehr Details', 'Plus de details')}
              </summary>
              <p className="mt-3 leading-7">
                {t(
                  'Dein Kursbereich laeuft direkt auf der lokalen Lektionenbibliothek. Hier siehst du den echten Fortschritt ueber die normalisierten Lektionen.',
                  'Ton espace cours lit directement la bibliotheque locale. Ici tu vois la progression reelle sur les lecons normalisees.'
                )}
              </p>
            </details>

            <div className="mt-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
              <div className={cx(cardClass.soft, 'p-4')}>
                <p className="text-[10px] uppercase tracking-[0.16em] text-brand-brown sm:text-sm">{t('Abgeschlossen', 'Terminees')}</p>
                <p className="mt-2 font-display text-2xl font-semibold text-brand-text sm:text-3xl">{completedLessons}</p>
              </div>
              <div className={cx(cardClass.soft, 'p-4')}>
                <p className="text-[10px] uppercase tracking-[0.16em] text-brand-brown sm:text-sm">{t('Lernzeit', 'Temps etudie')}</p>
                <p className="mt-2 font-display text-2xl font-semibold text-brand-text sm:text-3xl">{completedMinutes} min</p>
              </div>
              <div className={cx(cardClass.soft, 'p-4')}>
                <p className="text-[10px] uppercase tracking-[0.16em] text-brand-brown sm:text-sm">{t('Bibliothek', 'Bibliotheque')}</p>
                <p className="mt-2 font-display text-2xl font-semibold text-brand-text sm:text-3xl">{catalogStats.lessons}</p>
              </div>
            </div>
          </div>

          <div className={cx(cardClass.soft, 'p-5')}>
            <p className="section-kicker">{t('Weiter', 'Suite')}</p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-brand-text">
              {nextLesson ? nextLesson.titre : t('Alles erledigt', 'Tout est termine')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-brown">
              {nextLesson ? nextLesson.description : t('Die lokale Bibliothek ist gerade komplett durchlaufen.', 'La bibliotheque locale a ete entierement parcourue.')}
            </p>

            {nextLesson ? (
              <Link className={cx(buttonClass.primary, 'mt-5 w-full justify-center')} to={`/cours/${nextLesson.niveau}/lecon/${nextLesson.id}`}>
                <Icon name="arrowRight" size={18} className="icon" />
                {t('Weiterlernen', 'Continuer')}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <XPBar />

      <section className="flex snap-x gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
        {[
          { to: `/cours/${preferredLevel || 'A1'}`, icon: 'book', title: t('Kurse', 'Cours'), body: t('Lokale Lektionen durchsuchen und fortsetzen.', 'Parcourir et reprendre les lecons locales.') },
          { to: '/sprechen', icon: 'mic', title: t('Sprechen', 'Oral'), body: t('Aussprache und orale Praxis trainieren.', "Travailler l'oral et la prononciation.") },
          { to: '/communaute', icon: 'messageCircle', title: t('Community', 'Communaute'), body: t('Mit anderen Lernenden im Kontakt bleiben.', 'Rester en contact avec les autres apprenants.') },
        ].map((item) => (
          <Link key={item.to} className={cx(cardClass.interactive, 'min-w-[15.5rem] snap-start p-4 sm:min-w-[16.5rem] sm:p-5 lg:min-w-0')} to={item.to}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-sky text-brand-blue">
              <Icon name={item.icon} size={20} className="icon" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight text-brand-text">{item.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-brown sm:text-base">{item.body}</p>
          </Link>
        ))}
      </section>

      <section className={cx(cardClass.base, 'p-5 sm:p-8')}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-kicker">{t('Fortschritt', 'Progression')}</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-brand-text">
              {t('Niveau fuer Niveau', 'Niveau par niveau')}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {levelSummaries.map((item) => (
              <span key={item.level} className={levelBadgeClass(item.level)}>
                {item.level}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 flex snap-x gap-4 overflow-x-auto pb-2 xl:grid xl:grid-cols-2 xl:overflow-visible xl:pb-0">
          {levelSummaries.map((item) => (
            <article key={item.level} className={cx(cardClass.soft, 'min-w-[16.75rem] snap-start p-4 sm:min-w-[18rem] sm:p-5 xl:min-w-0')}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className={levelBadgeClass(item.level)}>{item.level}</span>
                  <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight text-brand-text">
                    {item.completed}/{item.total} {t('Lektionen', 'lecons')}
                  </h3>
                </div>
                <Link className={buttonClass.outline} to={`/cours/${item.level}`}>
                  {t('Oeffnen', 'Ouvrir')}
                </Link>
              </div>

              <div className="mt-5 progress-track">
                <div className="progress-fill" style={{ width: `${item.progress}%` }} />
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 text-sm text-brand-brown">
                <span>{item.progress}%</span>
                <span className="truncate text-right">{item.nextInLevel ? item.nextInLevel.titre : t('Komplett', 'Complet')}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Dashboard
