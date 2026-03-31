import { useEffect, useState } from 'react'
import { useSessionStore, SESSION_VIEWS } from '../stores/sessionStore'

export const WarmupScreen = ({ seconds = 30 }) => {
  const setCurrentView = useSessionStore((s) => s.setCurrentView)
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    setRemaining(seconds)
    const interval = setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [seconds])

  useEffect(() => {
    if (remaining === 0) setCurrentView(SESSION_VIEWS.SESSION)
  }, [remaining, setCurrentView])

  return (
    <div className="relative flex min-h-[420px] w-full items-center justify-center overflow-hidden rounded-[24px] border border-white/10 bg-black/20 p-6 text-center sm:min-h-[560px] sm:rounded-[32px] sm:p-10">
      <div className="max-w-md">
        <p className="sprechen-display text-xl font-semibold tracking-tight text-white sm:text-2xl">Warm-up</p>
        <p className="mt-3 text-sm leading-6 text-white/62">
          Respire, pense au contexte, puis parle en allemand. La session commence automatiquement.
        </p>
        <div className="mt-8 text-[clamp(3.5rem,16vw,6rem)] font-bold text-white">{remaining}s</div>
        <button
          type="button"
          className="mt-8 w-full rounded-full border border-white/12 bg-white/8 px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/12 sm:w-auto"
          onClick={() => setCurrentView(SESSION_VIEWS.SESSION)}
        >
          Commencer maintenant
        </button>
      </div>
    </div>
  )
}

export default WarmupScreen
