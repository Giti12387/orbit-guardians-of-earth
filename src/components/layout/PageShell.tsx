import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { cn } from '../../lib/utils'

export function PageShell({
  children,
  className,
  backTo,
  backLabel = 'Back',
}: {
  children: ReactNode
  className?: string
  backTo?: string
  backLabel?: string
}) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35 }}
      className={cn('relative min-h-screen overflow-x-hidden', className)}
    >
      {backTo && (
        <div className="pointer-events-none fixed left-4 top-4 z-40 sm:left-6 sm:top-6">
          <Link
            to={backTo}
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-bg-secondary/70 px-3 py-2 text-sm text-text backdrop-blur-md hover:border-cyan/45"
          >
            <ChevronLeft size={16} /> {backLabel}
          </Link>
        </div>
      )}
      {children}
    </motion.main>
  )
}
