import { motion } from 'framer-motion'

export const BadgeCarousel = ({ badges = [] }) => {
  if (!badges?.length) return null
  return (
    <div className="mt-6 rounded-[26px] border border-white/10 bg-white/6 p-4">
      <p className="text-sm font-semibold text-white/90">Badges gagnés</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {badges.map((badge, index) => (
          <motion.div
            key={`${badge}-${index}`}
            initial={{ scale: 0, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ delay: 0.18 + index * 0.12 }}
            className="rounded-full border border-white/12 bg-black/30 px-3 py-2 text-xs font-semibold text-white/80"
          >
            {badge}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default BadgeCarousel

