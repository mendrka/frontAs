function getMood(score) {
  if (score >= 85) return { emoji: '🔥', label: 'Flow' }
  if (score >= 65) return { emoji: '🙂', label: 'Stable' }
  if (score >= 45) return { emoji: '😐', label: 'Fragile' }
  return { emoji: '😰', label: 'Tendu' }
}

export default function ConfidenceMeter({ confidenceScore = 52 }) {
  const mood = getMood(confidenceScore)

  return (
    <div className="sp-confidence">
      <div className="sp-conf-label">Confiance</div>
      <div className="sp-conf-track">
        <div className="sp-conf-fill" style={{ width: `${confidenceScore}%` }} />
      </div>
      <div className="sp-conf-emoji" aria-label={mood.label}>{mood.emoji}</div>
      <div className="sp-char-sub">{mood.label}</div>
    </div>
  )
}
