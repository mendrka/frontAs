import { motion } from 'framer-motion'
import { LifeBuoy, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { buildRescuePhrase, simplifyPrompt } from '../../utils'
import Badge from '../shared/Badge'
import Button from '../shared/Button'
import Card from '../shared/Card'

export default function RescueSystem({
  hintLevel,
  theme,
  level,
  lastAiMessage,
  onDismiss,
  onUseSuggestion,
}) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    setDetailsOpen(hintLevel < 3)
  }, [hintLevel])

  if (!hintLevel || !theme) return null

  const quickWords = theme.vocabularyHints.slice(0, 3)
  const suggestedPhrase = buildRescuePhrase(theme, level)

  return (
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="pointer-events-auto">
      <Card tone="elevated" className="border-orange-300/25 bg-[#24150f]/88 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge variant="warning">Rescue level {hintLevel}</Badge>
            {detailsOpen && (
              <p className="mt-3 text-sm leading-6 text-white/72">
                {hintLevel === 1 && 'Prends appui sur quelques mots cles pour repartir.'}
                {hintLevel === 2 && 'Version simplifiee de la demande pour relancer sans bloquer.'}
                {hintLevel >= 3 && 'Phrase complete de secours. Clique si tu veux la jouer telle quelle.'}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hintLevel >= 3 && (
              <button
                type="button"
                className="rounded-full bg-white/10 p-2 text-white/64 transition hover:bg-white/16 hover:text-white"
                onClick={() => setDetailsOpen((value) => !value)}
                aria-label={detailsOpen ? 'Masquer l aide detaillee' : 'Afficher l aide detaillee'}
              >
                <LifeBuoy size={16} />
              </button>
            )}
            <button
              type="button"
              className="rounded-full bg-white/10 p-2 text-white/64 transition hover:bg-white/16 hover:text-white"
              onClick={onDismiss}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {detailsOpen && hintLevel >= 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {quickWords.map((word) => (
              <Badge key={word} variant="neutral">
                {word}
              </Badge>
            ))}
          </div>
        )}

        {detailsOpen && hintLevel >= 2 && (
          <p className="mt-4 rounded-[22px] bg-black/18 px-4 py-3 text-sm text-white/78">
            {simplifyPrompt(lastAiMessage, theme)}
          </p>
        )}

        {!detailsOpen && hintLevel >= 3 && (
          <div className="mt-4 flex items-center justify-between rounded-[18px] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/72">
            <span>Aide complete masquee</span>
            <button
              type="button"
              className="text-orange-200 transition hover:text-white"
              onClick={() => setDetailsOpen(true)}
            >
              Ouvrir
            </button>
          </div>
        )}

        {detailsOpen && hintLevel >= 3 && (
          <div className="mt-4 rounded-[24px] border border-white/10 bg-white/6 p-4">
            <p className="text-sm text-white/72">{suggestedPhrase}</p>
            <Button className="mt-4" size="sm" onClick={() => onUseSuggestion(suggestedPhrase)}>
              Utiliser cette phrase
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  )
}
