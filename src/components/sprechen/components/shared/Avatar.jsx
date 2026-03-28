import { cn } from '../../utils'

export default function Avatar({ character, size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-12 w-12 text-xl',
    md: 'h-16 w-16 text-2xl',
    lg: 'h-20 w-20 text-3xl',
  }

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-[28px] border border-white/12 bg-white/10 text-white shadow-[0_20px_50px_-24px_rgba(0,0,0,0.5)]',
        sizes[size],
        className
      )}
    >
      <div
        className={cn(
          'absolute inset-1 rounded-[24px] bg-gradient-to-br opacity-85',
          character?.avatarTone || 'from-slate-300 via-slate-200 to-white'
        )}
      />
      <span className="relative">{character?.emoji || '🎤'}</span>
    </div>
  )
}
