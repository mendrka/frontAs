import { Link } from 'react-router-dom'
import { useAuth } from '@context/AuthContext'
import { useLang } from '@context/LangContext'
import { getCatalogStats, listAvailableLevels, listLevelLessons } from '@data/lessonCatalog'
import Icon from '@components/ui/Icon'
import { buttonClass, cardClass, cx, levelBadgeClass } from '@utils/ui'

function Home() {
  const { user } = useAuth()
  const { t } = useLang()
  const stats = getCatalogStats()
  const levels = listAvailableLevels()
  const spotlightLessons = levels.flatMap((level) => listLevelLessons(level).slice(0, 1)).slice(0, 4)

  return (
    <div className="space-y-8">
      <section className={cx(cardClass.base, 'overflow-hidden p-6 sm:p-8 lg:p-10')}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <p className="section-kicker">EAM</p>
            <h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold tracking-tight text-brand-text sm:text-5xl">
              {t(
                'Deutsch lernen mit einer lokalen Bibliothek, klaren Lektionen und direktem Zugriff auf den echten Inhalt.',
                "Apprendre l'allemand avec une bibliotheque locale, des lecons lisibles et un contenu reel directement exploite."
              )}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-brand-brown sm:text-lg">
              {t(
                'Die Plattform zeigt jetzt die lokale Lektionenstruktur direkt an: Einfuehrung, Dialoge, Grammatik, Wortschatz, Kultur und normalisierte Uebungen.',
                "La plateforme affiche maintenant directement la structure riche des lecons locales: intro, dialogues, grammaire, vocabulaire, culture et exercices normalises."
              )}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              {user ? (
                <Link className={buttonClass.primary} to="/dashboard">
                  <Icon name="home" size={18} className="icon" />
                  {t('Zum Dashboard', 'Aller au tableau de bord')}
                </Link>
              ) : (
                <>
                  <Link className={buttonClass.primary} to="/login">
                    <Icon name="arrowRight" size={18} className="icon" />
                    {t('Einloggen', 'Se connecter')}
                  </Link>
                  <Link className={buttonClass.outline} to="/register">
                    <Icon name="checkCircle" size={18} className="icon" />
                    {t('Konto erstellen', 'Creer un compte')}
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className={cx(cardClass.soft, 'p-5')}>
            <p className="section-kicker">{t('Bibliothek', 'Bibliotheque')}</p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[1.5rem] bg-white/80 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-brand-brown">{t('Niveaus', 'Niveaux')}</p>
                <p className="mt-2 font-display text-3xl font-semibold text-brand-text">{stats.levels}</p>
              </div>
              <div className="rounded-[1.5rem] bg-white/80 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-brand-brown">{t('Lektionen', 'Lecons')}</p>
                <p className="mt-2 font-display text-3xl font-semibold text-brand-text">{stats.lessons}</p>
              </div>
              <div className="rounded-[1.5rem] bg-white/80 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-brand-brown">{t('Uebungen', 'Exercices')}</p>
                <p className="mt-2 font-display text-3xl font-semibold text-brand-text">{stats.exercises}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          {
            icon: 'book',
            title: t('Reiche Lektionen', 'Lecons riches'),
            body: t(
              'Jede Lektion kann Dialoge, Grammatik, Kultur und echte Metadaten enthalten.',
              'Chaque lecon peut contenir dialogues, grammaire, culture et vraies metadonnees.'
            ),
          },
          {
            icon: 'translate',
            title: t('Direkte Normalisierung', 'Normalisation directe'),
            body: t(
              'Die lokale Bibliothek wird ohne alten API-Umweg fuer die UI lesbar gemacht.',
              "La bibliotheque locale est rendue lisible pour l'UI sans repasser par l'ancien flux API."
            ),
          },
          {
            icon: 'bolt',
            title: t('Fortschritt und XP', 'Progression et XP'),
            body: t(
              'XP, naechste Lektion und lokale Completion werden in die Lektionen eingeblendet.',
              'XP, prochaine lecon et completion locale sont injectees dans le parcours.'
            ),
          },
        ].map((item) => (
          <article key={item.title} className={cx(cardClass.base, 'p-5')}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-sky text-brand-blue">
              <Icon name={item.icon} size={20} className="icon" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight text-brand-text">{item.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-brown sm:text-base">{item.body}</p>
          </article>
        ))}
      </section>

      <section className={cx(cardClass.base, 'p-6 sm:p-8')}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-kicker">{t('Niveaus', 'Niveaux')}</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-brand-text">
              {t('Verfuegbare Stufen', 'Parcours disponibles')}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {levels.map((level) => (
              <Link key={level} className={levelBadgeClass(level)} to={`/cours/${level}`}>
                {level}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {spotlightLessons.map((lesson) => (
            <article key={lesson.id} className={cx(cardClass.soft, 'p-5')}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className={levelBadgeClass(lesson.niveau)}>{lesson.niveau}</span>
                  <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight text-brand-text">{lesson.titre}</h3>
                </div>
                <span className="stat-chip">
                  <Icon name="clock" size={14} className="icon" />
                  {lesson.duree || 0} min
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-brand-brown sm:text-base">{lesson.description}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-sm text-brand-brown">
                <span className="stat-chip">{lesson.phrasesCount || 0} {t('Phrasen', 'phrases')}</span>
                <span className="stat-chip">{lesson.exercicesCount || 0} {t('Uebungen', 'exercices')}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home
