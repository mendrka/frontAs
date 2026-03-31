import { cn } from '../../utils'

const tones = {
  default: 'bg-white/8 border-white/10',
  elevated: 'bg-white/12 border-white/14 shadow-[0_24px_60px_-32px_rgba(0,0,0,0.45)]',
  soft: 'bg-black/18 border-white/8',
}

export default function Card({ tone = 'default', className = '', children, ...props }) {
  return (
    <div
      className={cn('rounded-[24px] border backdrop-blur-xl sm:rounded-[28px]', tones[tone], className)}
      {...props}
    >
      {children}
    </div>
  )
}
