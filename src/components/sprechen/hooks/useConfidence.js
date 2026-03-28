import { useMemo } from 'react'

export const useConfidence = ({ responseTimeMs, score }) => {
  return useMemo(() => {
    let base = Number.isFinite(score) ? score : 50
    if (Number.isFinite(responseTimeMs)) {
      if (responseTimeMs < 3000) base = Math.min(base + 20, 100)
      else if (responseTimeMs > 8000) base = Math.max(base - 20, 0)
    }
    return Math.max(0, Math.min(100, Math.round(base)))
  }, [responseTimeMs, score])
}

