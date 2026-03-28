import { useMemo } from 'react'

export const SpeedRound = ({ currentTurn = 0, expectedTurns = 10 }) => {
  const active = useMemo(() => currentTurn >= Math.floor(expectedTurns * 0.66), [currentTurn, expectedTurns])
  if (!active) return null
  return (
    <div className="rounded-full border border-white/10 bg-white/8 px-3 py-2 text-xs font-semibold text-white/80">
      Speed round
    </div>
  )
}

export default SpeedRound

