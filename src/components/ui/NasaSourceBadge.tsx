import type { DataSourceRef } from '../../lib/nasaData'
import { HudTag } from './Panel'

export function NasaSourceBadge({ sources }: { sources: DataSourceRef[] }) {
  return (
    <div className="space-y-2">
      <div className="hud-label">Data Sources & Attribution</div>
      <div className="flex flex-wrap gap-2">
        {sources.map((s) => (
          <HudTag key={`${s.name}-${s.date}`} tone={s.type === 'real' ? 'green' : s.type === 'archived' ? 'cyan' : 'amber'}>
            {s.type}
          </HudTag>
        ))}
      </div>
      <ul className="space-y-1 text-xs leading-5 text-text-muted">
        {sources.map((s, i) => (
          <li key={i}>
            <span className="text-text">{s.name}</span> — {s.date}{s.note ? ` (${s.note})` : ''}
            {s.url ? (
              <>
                {' '}<a className="text-cyan hover:underline" href={s.url} target="_blank" rel="noreferrer">source</a>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
