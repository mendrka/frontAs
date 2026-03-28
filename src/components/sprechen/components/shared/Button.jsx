import { motion } from 'framer-motion'
import { cn } from '../../utils'

const variants = {
  primary: 'bg-[#f8633f] text-white shadow-[0_18px_44px_-22px_rgba(248,99,63,0.7)] hover:bg-[#ff7d58]',
  secondary: 'bg-white/10 text-white border border-white/15 hover:bg-white/16',
  ghost: 'bg-transparent text-white/78 hover:bg-white/10',
  danger: 'bg-rose-500/18 text-rose-100 border border-rose-400/30 hover:bg-rose-500/24',
}

const sizes = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-5 text-sm',
  lg: 'h-14 px-6 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  children,
  ...props
}) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-55',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  )
}
