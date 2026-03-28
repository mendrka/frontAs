export const LevelBadge = ({ level, className = '' }) => {
  if (!level) return null
  return (
    <span
      className={`inline-flex items-center rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-semibold text-white/80 ${className}`}
    >
      {String(level).toUpperCase()}
    </span>
  )
}

export default LevelBadge

