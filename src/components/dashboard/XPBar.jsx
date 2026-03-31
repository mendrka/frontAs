import { useLang } from '@context/LangContext'
import { useGamification } from '@context/GamificationContext'
import { cardClass, cx } from '@utils/ui'

function XPBar() {
  const { t } = useLang()
  const { data, loading } = useGamification()

  const xp = data?.stats?.xp || 0
  const level = data?.stats?.level || 1
  const streak = data?.stats?.streakCurrent || 0
  const badgesCount = data?.stats?.badgesCount || 0
  const current = data?.xpWindow?.current || 0
  const next = data?.xpWindow?.next || 100
  const pct = next > 0 ? Math.round((current / next) * 100) : 0

  return (
    <div className={cx(cardClass.base, 'overflow-hidden p-4 sm:p-6')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="section-kicker">{t('Gamification', 'Gamification')}</p>
          <h3 className="mt-2 font-display text-xl font-semibold tracking-tight text-brand-text sm:text-2xl">
            {t('Level', 'Niveau')} {level}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-brand-brown sm:text-sm">
          <span className="stat-chip">⚡ {xp} XP</span>
          <span className="stat-chip">🔥 {streak}</span>
          <span className="stat-chip">🏅 {badgesCount}</span>
        </div>
      </div>

      <div className="mt-5 progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 flex flex-col gap-2 text-sm text-brand-brown min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
        <span>{loading ? t('Laden...', 'Chargement...') : `${current}/${next} XP`}</span>
        <span>{t('Nächstes Level', 'Niveau suivant')}</span>
      </div>
    </div>
  )
}

export default XPBar
