import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import Badge from '../shared/Badge'
import Button from '../shared/Button'

export default function VocabCollector({ words = [], collectedCount = 0, onCollect }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">Vocabulary collector</p>
          <p className="mt-2 text-sm text-white/72">{collectedCount} mots captures dans cette scene</p>
        </div>
        <Badge variant="accent">{collectedCount} captures</Badge>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
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
