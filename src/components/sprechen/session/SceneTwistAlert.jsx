import { motion } from 'framer-motion'

export const SceneTwistAlert = ({ message }) => {
  if (!message) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute left-1/2 top-6 z-20 w-[min(540px,92%)] -translate-x-1/2 rounded-[22px] border border-white/12 bg-black/50 px-4 py-3 backdrop-blur"
    >
      <p className="text-sm font-semibold text-white">Événement surprise</p>
      <p className="mt-1 text-sm text-white/72">{message}</p>
    </motion.div>
  )
}

export default SceneTwistAlert

