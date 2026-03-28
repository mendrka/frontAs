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
    <div className="relative flex min-h-[560px] w-full items-center justify-center overflow-hidden rounded-[32px] border border-white/10 bg-black/20 p-10 text-center">
      <div className="max-w-md">
        <p className="sprechen-display text-2xl font-semibold tracking-tight text-white">Warm-up</p>
        <p className="mt-3 text-sm leading-6 text-white/62">
          Respire, pense au contexte, puis parle en allemand. La session commence automatiquement.
        </p>
        <div className="mt-8 text-6xl font-bold text-white">{remaining}s</div>
        <button
          type="button"
          className="mt-8 rounded-full border border-white/12 bg-white/8 px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/12"
          onClick={() => setCurrentView(SESSION_VIEWS.SESSION)}
        >
          Commencer maintenant
        </button>
      </div>
    </div>
  )
}

export default WarmupScreen

