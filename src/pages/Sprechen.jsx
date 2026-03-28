import { useCallback } from 'react'
import { Sparkles, Volume2 } from 'lucide-react'
import { useAuth } from '@context/AuthContext'
import { useGamification } from '@context/GamificationContext'
import SprechenComponent from '@components/sprechen/SprechenComponent'

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
      <section className="page-card relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(75,156,211,0.14),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(111,166,122,0.12),transparent_28%)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-blue/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand-blue">
              <Volume2 size={14} />
              Sprechen
            </div>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-brand-text sm:text-[3.2rem]">
              Scenes orales immersives, zero API payante obligatoire.
            </h1>
            <p className="mt-4 text-base leading-8 text-brand-brown/85">
              Le module gere sa propre progression locale, la voix navigateur, le feedback scene par scene et peut appeler Groq si une cle est fournie. Sans cle, il degrade proprement en mode offline.
            </p>
          </div>

          <div className="rounded-[2rem] border border-brand-border/80 bg-white/72 px-5 py-4 shadow-soft backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-blue text-white">
                <Sparkles size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-blue">Micro-aventure</p>
                <p className="mt-1 text-sm text-brand-brown">Parle, improvise, tiens la scene.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SprechenComponent
        userId={user?.id || null}
        userLevel={user?.niveau ? String(user.niveau).toUpperCase() : null}
        groqApiKey={import.meta.env.VITE_GROQ_API_KEY}
        apiEndpoint={import.meta.env.VITE_SPRECHEN_API_ENDPOINT || null}
        onSessionEnd={handleSessionEnd}
        onXPEarned={handleXPEarned}
      />
    </div>
  )
}

export default Sprechen
