import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { PageShell } from '../components/layout/PageShell'
import { Panel, HudTag } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { NasaSourceBadge } from '../components/ui/NasaSourceBadge'
import { getInvestigationMission } from '../data/earthGuardiansMissions'

export function InvestigationBriefing() {
  const { missionId } = useParams()
  const m = missionId ? getInvestigationMission(missionId) : undefined
  if (!m) return <Navigate to="/earth-guardians" replace />
  return (
    <PageShell backTo="/earth-guardians" backLabel="Earth Guardians" className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <Panel className="p-6 sm:p-8">
          <div className="hud-label" style={{ color: m.accent }}>Mission Briefing</div>
          <h1 className="mt-2 font-[Space_Grotesk] text-3xl font-semibold">{m.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2"><HudTag tone="cyan">{m.topic}</HudTag><HudTag>{m.location}</HudTag></div>
          <p className="mt-4 text-sm leading-7 text-text-muted">{m.briefing}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Panel className="bg-bg/25 p-4"><div className="hud-label">Objectives</div><ol className="mt-3 space-y-2 text-sm text-text-muted">{m.objectives.map((o, i) => <li key={o} className="flex gap-3"><span className="font-[Orbitron] text-xs text-cyan">0{i + 1}</span>{o}</li>)}</ol></Panel>
            <Panel className="bg-bg/25 p-4"><div className="hud-label">Investigation Method</div><p className="mt-3 text-sm leading-7 text-text-muted">You will examine multiple evidence items (observations and context), compare them, identify the best-supported environmental issue, and submit a mission report. Some values are simulated training data when live services are unavailable; sources and dates are labeled.</p></Panel>
          </div>
          <div className="mt-5"><NasaSourceBadge sources={m.sources} /></div>
          <div className="mt-6"><Link to={`/mission/${m.id}`}><Button variant="primary">Begin Investigation <ArrowRight size={16} /></Button></Link></div>
        </Panel>
      </div>
    </PageShell>
  )
}
