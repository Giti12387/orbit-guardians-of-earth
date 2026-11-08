export function ProgressBar({ value, tone = 'cyan' }: { value: number; tone?: 'cyan' | 'green' | 'amber' }) {
  const pct = Math.max(0, Math.min(100, value))
  const tones = {
    cyan: 'from-cyan to-blue',
    green: 'from-success to-cyan',
    amber: 'from-amber to-[#ff7a1a]',
  }
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${tones[tone]} transition-[width] duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
