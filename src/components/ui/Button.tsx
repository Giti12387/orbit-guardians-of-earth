import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'success'

const variants: Record<Variant, string> = {
  primary:
    'bg-[linear-gradient(135deg,rgba(0,217,255,0.22),rgba(23,107,255,0.28))] border-cyan/45 text-text shadow-[0_0_24px_rgba(0,217,255,0.16)] hover:border-cyan/80 hover:shadow-[0_0_30px_rgba(0,217,255,0.24)]',
  secondary:
    'bg-[rgba(8,22,43,0.55)] border-[rgba(145,166,192,0.22)] text-text hover:border-cyan/35 hover:bg-[rgba(10,28,54,0.72)]',
  ghost: 'bg-transparent border-transparent text-text-muted hover:text-text hover:bg-white/5',
  success:
    'bg-[linear-gradient(135deg,rgba(70,229,138,0.18),rgba(0,217,255,0.12))] border-success/45 text-text hover:border-success/80',
}

type ButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> & {
  variant?: Variant
  children?: ReactNode
}

export function Button({
  className,
  variant = 'secondary',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.985 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[12px] border px-4 py-2.5 text-sm font-semibold tracking-wide transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-45',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  )
}
