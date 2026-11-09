import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('glass-panel rounded-[18px]', className)} {...props} />
}

export function HudTag({
  children,
  tone = 'cyan',
}: {
  children: React.ReactNode
  tone?: 'cyan' | 'amber' | 'green' | 'violet'
}) {
  const tones = {
    cyan: 'border-cyan/35 bg-cyan/10 text-cyan',
    amber: 'border-amber/35 bg-amber/10 text-amber',
    green: 'border-success/35 bg-success/10 text-success',
    violet: 'border-violet/35 bg-violet/10 text-violet',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 font-[Orbitron] text-[10px] tracking-[0.16em] uppercase',
        tones[tone],
      )}
    >
      {children}
    </span>
  )
}
