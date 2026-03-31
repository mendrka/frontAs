import { cn } from '../../utils'

export default function Avatar({ character, size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-11 w-11 text-lg sm:h-12 sm:w-12 sm:text-xl',
    md: 'h-14 w-14 text-xl sm:h-16 sm:w-16 sm:text-2xl',
    lg: 'h-16 w-16 text-2xl sm:h-20 sm:w-20 sm:text-3xl',
  }

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-[22px] border border-white/12 bg-white/10 text-white shadow-[0_20px_50px_-24px_rgba(0,0,0,0.5)] sm:rounded-[28px]',
        sizes[size],
        className
      )}
    >
      <div
        className={cn(
          'absolute inset-1 rounded-[18px] bg-gradient-to-br opacity-85 sm:rounded-[24px]',
          character?.avatarTone || 'from-slate-300 via-slate-200 to-white'
        )}
      />
      <span className="relative">{character?.emoji || '🎤'}</span>
    </div>
  )
}
