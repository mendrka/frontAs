import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import Badge from '../shared/Badge'
import Button from '../shared/Button'

export default function VocabCollector({ words = [], collectedCount = 0, onCollect }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">Vocabulary collector</p>
          <p className="mt-2 hidden text-sm text-white/72 sm:block">{collectedCount} mots captures dans cette scene</p>
          <p className="mt-2 text-xs text-white/54 sm:hidden">
            {words.length ? `${words.length} mot${words.length > 1 ? 's' : ''} a trier` : 'Aucun mot a afficher'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="accent">{collectedCount} captures</Badge>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white/72 transition hover:bg-white/14 hover:text-white sm:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Masquer le collecteur de vocabulaire' : 'Afficher le collecteur de vocabulaire'}
          >
            {mobileOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      <div className={`mt-4 flex flex-wrap gap-3 ${mobileOpen ? 'flex' : 'hidden'} sm:flex`}>
        {words.length === 0 && <p className="text-sm text-white/48">Les nouveaux mots apparaitront ici.</p>}

        {words.map((word, index) => (
          <motion.div
            key={word}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="vocab-badge"
          >
            <Button variant="secondary" size="sm" className="rounded-full px-3" onClick={() => onCollect(word)}>
              <Sparkles size={14} />
              {word}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
