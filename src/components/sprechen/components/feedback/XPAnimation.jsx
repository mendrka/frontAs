import { motion } from 'framer-motion'
import { Award, Sparkles } from 'lucide-react'
import { getLevelProgress } from '../../utils'
import Badge from '../shared/Badge'
import Card from '../shared/Card'

export default function XPAnimation({ feedback, globalXP, level }) {
  const progress = getLevelProgress(globalXP)

  return (
    <Card tone="elevated" className="relative overflow-hidden p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(248,115,75,0.24),transparent_36%)]" />
      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">XP outcome</p>
            <motion.p
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 sprechen-display text-5xl font-semibold text-white"
            >
              +{feedback.xpEarned} XP
            </motion.p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="accent">{level}</Badge>
            {feedback.badges?.map((badge) => (
              <Badge key={badge} variant="neutral">
                <Award size={12} />
                {badge}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-full bg-white/8 p-1">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress.percentage}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="xp-bar-fill flex h-3 rounded-full bg-[linear-gradient(90deg,#f66f46_0%,#f8b964_45%,#79f2cc_100%)]"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-white/58">
          <span>{progress.currentXP} XP cumules</span>
          <span>
            Progression {progress.currentLevel} → {progress.nextLabel}
          </span>
        </div>

        {feedback.globalScore >= 90 && (
          <div className="mt-6 flex items-center gap-3 rounded-[22px] border border-emerald-300/26 bg-emerald-400/14 px-4 py-3 text-sm text-emerald-50">
            <Sparkles size={16} />
            Session presque parfaite. Le systeme te pousse vers une scene plus dense ensuite.
          </div>
        )}
      </div>
    </Card>
  )
}
