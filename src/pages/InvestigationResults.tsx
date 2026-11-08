import { useEffect, useMemo, useRef } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { PageShell } from '../components/layout/PageShell'
import { Panel, HudTag } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { NasaSourceBadge } from '../components/ui/NasaSourceBadge'
import { completeMission } from '../store/gameStore'
import { getInvestigationMission } from '../data/earthGuardiansMissions'

export function InvestigationResults() {
  const { missionId } = useParams()
  const { state } = useLocation() as { state?: { correct?: boolean; accuracy?: number; score?: number; collectedCount?: number } }
  const m = missionId ? getInvestigationMission(missionId) : undefined
  const committed = useRef(false)
  const c = useMemo(() => ({ correct: !!state?.correct, accuracy: state?.accuracy ?? 0, score: state?.score ?? 0, collectedCount: state?.collectedCount ?? m?.evidence.length ?? 0 }), [state, m])
  useEffect(() => {
    if (!m || committed.current || !state) return
    committed.current = true
    completeMission(m.id, {
      score: c.score, accuracy: c.accuracy, xp: c.correct ? 220 : 110, research: c.correct ? 80 : 35, discovery: c.correct ? 90 : 40,
      observations: c.collectedCount, missionName: m.title, objectivesCompleted: c.correct ? m.objectives.length : Math.max(1, m.objectives.length - 1), objectivesTotal: m.objectives.length,
      findings: m.findings, summary: c.correct ? `Investigation completed: ${m.topic} issue identified using evidence.` : `Investigation completed with partial accuracy for ${m.topic}. Review the evidence explanation.`,
      sources: m.sources,
    })
  }, [c, m, state])
  if (!m) return <Navigate to="/earth-guardians" replace />
  if (!state) return <Navigate to={`/mission/${m.id}/briefing`} replace />
  return (
    <PageShell backTo="/earth-guardians" backLabel="Earth Guardians" className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <Panel className="p-6">
          <div className="hud-label text-success">Mission Report</div>
          <h1 className="mt-2 font-[Space_Grotesk] text-3xl font-semibold">{m.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2"><HudTag tone={c.correct ? 'green' : 'amber'}>{c.correct ? 'Objectives met' : 'Review recommended'}</HudTag><HudTag tone="cyan">Score {c.score}</HudTag><HudTag>Accuracy {c.accuracy}%</HudTag></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Panel className="bg-bg/25 p-4"><div className="hud-label">Scientific Findings</div><ul className="mt-3 space-y-2 text-sm text-text-muted">{m.findings.map((f) => <li key={f}>• {f}</li>)}</ul></Panel>
            <Panel className="bg-bg/25 p-4"><div className="hud-label">Rewards</div><div className="mt-3 text-sm text-text-muted">XP +{c.correct ? 220 : 110} · Research +{c.correct ? 80 : 35} · Discovery +{c.correct ? 90 : 40} · Observations {c.collectedCount}</div><div className="mt-4"><NasaSourceBadge sources={m.sources} /></div></Panel>
          </div>
          <div className="mt-6 flex flex-wrap gap-3"><Link to={`/mission/${m.id}/briefing`}><Button variant="primary">Replay Mission</Button></Link><Link to="/mission-control"><Button>Mission Control</Button></Link><Link to="/earth-guardians"><Button>Earth Guardians</Button></Link></div>
        </Panel>
      </div>
    </PageShell>
  )
}
