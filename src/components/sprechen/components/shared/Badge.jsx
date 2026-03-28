import { cn } from '../../utils'

const variants = {
  neutral: 'bg-white/10 text-white/75 border border-white/10',
  accent: 'bg-orange-400/18 text-orange-100 border border-orange-300/30',
  success: 'badge-correct',
  warning: 'badge-acceptable',
  error: 'badge-incorrect',
  level: 'bg-white/12 text-white border border-white/14',
}

export default function Badge({ variant = 'neutral', className = '', children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold tracking-[0.12em] uppercase',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
