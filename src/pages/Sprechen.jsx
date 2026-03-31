import { lazy, Suspense, useCallback } from 'react'
import { Sparkles, Volume2 } from 'lucide-react'
import { useAuth } from '@context/AuthContext'
import { useGamification } from '@context/GamificationContext'

const SprechenComponent = lazy(() => import('@components/sprechen/SprechenComponent'))

function SprechenModuleFallback() {
  return (
    <div className="page-card flex min-h-[24rem] items-center justify-center p-6 text-center">
      <div>
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand-border border-t-brand-blue" />
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-brand-brown">
          Chargement de la session orale
        </p>
      </div>
    </div>
  )
}

function Sprechen() {
  const { user } = useAuth()
  const { addXp, refresh } = useGamification()

  const handleSessionEnd = useCallback(async () => {
    try {
      await refresh()
    } catch (error) {
      console.warn('Unable to refresh gamification stats after Sprechen session.', error)
    }
  }, [refresh])

  const handleXPEarned = useCallback(
    async (xp) => {
      try {
        await addXp(xp, 'sprechen_session')
      } catch (error) {
        console.warn('Unable to sync Sprechen XP with parent gamification.', error)
      }
    },
    [addXp]
  )

  return (
    <div className="shell space-y-6 pb-24 lg:pb-10">
      <section className="page-card relative overflow-hidden p-4 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(75,156,211,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(111,166,122,0.16),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.35),transparent_58%)]" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-blue/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue">
              <Volume2 size={14} />
              Sprechen
            </div>
            <h1 className="font-display text-[clamp(2rem,1.55rem+2vw,3.2rem)] font-semibold tracking-tight text-brand-text">
              Oral immersif, interface epuree, experience mobile d'abord.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-brand-brown/85 sm:text-base sm:leading-8">
              Le frontend passe maintenant uniquement par le backend Node.js. La scene orale reste propre sur telephone: moins de bruit visuel, plus de contexte, et les actions secondaires restent dans les menus au lieu d'envahir l'ecran.
            </p>
            <details className="mt-4 max-w-2xl rounded-[1.35rem] border border-white/75 bg-white/72 p-4 text-sm text-brand-brown shadow-sm">
              <summary className="cursor-pointer list-none font-semibold text-brand-text">
                Voir le detail technique
              </summary>
              <p className="mt-3 leading-7">
                Les appels passent par le backend Sprechen, avec fallback LLM sur OpenRouter si Gemini est a quota, et fallback TTS sur VoiceRSS si Azure est absent. L'interface mobile garde les commandes principales visibles et range le reste dans des panneaux ou menus.
              </p>
            </details>

            <div className="mt-5 flex flex-wrap gap-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-brown/80">
              <span className="stat-chip">OpenRouter actif</span>
              <span className="stat-chip">VoiceRSS actif</span>
              <span className="stat-chip">Mode mobile optimise</span>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-brand-border/80 bg-white/72 px-4 py-4 shadow-soft backdrop-blur-sm sm:rounded-[2rem] sm:px-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-blue text-white">
                <Sparkles size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-blue">Session concentree</p>
                <p className="mt-1 text-sm text-brand-brown">Parle, improvise, puis laisse le reste se ranger tout seul.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={<SprechenModuleFallback />}>
        <SprechenComponent
          userLevel={user?.niveau ? String(user.niveau).toUpperCase() : null}
          onSessionEnd={handleSessionEnd}
          onXPEarned={handleXPEarned}
        />
      </Suspense>
    </div>
  )
}

export default Sprechen
