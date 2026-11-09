import { useEffect, useMemo, useRef } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { PageShell } from '../components/layout/PageShell'
import { Panel, HudTag } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { NasaSourceBadge } from '../components/ui/NasaSourceBadge'
import { completeMission, getLatestMissionReport, loadState } from '../store/gameStore'
import { getInvestigationMission } from '../data/earthGuardiansMissions'

export function InvestigationResults() {
  const { missionId } = useParams()
  const { state: incoming } = useLocation() as { state?: { completionId?: string; correct?: boolean; accuracy?: number; score?: number; collectedCount?: number } }
  const m = missionId ? getInvestigationMission(missionId) : undefined
  const committed = useRef(false)
  const saved = useMemo(() => (m ? getLatestMissionReport(loadState(), m.id) : undefined), [m])
  const view = useMemo(() => {
    if (incoming) return { ...incoming, fromSaved: false }
    if (saved) return { correct: saved.accuracy >= 100, accuracy: saved.accuracy, score: saved.score, collectedCount: saved.observationsCollected, fromSaved: true }
    return null
  }, [incoming, saved])

  useEffect(() => {
    if (!m || committed.current || !incoming) return
    committed.current = true
    const correct = !!incoming.correct
    completeMission(m.id, {
      completionId: incoming.completionId,
      score: incoming.score ?? 0,
      accuracy: incoming.accuracy ?? 0,
      xp: correct ? 220 : 110,
      research: correct ? 80 : 35,
      discovery: correct ? 90 : 40,
      observations: incoming.collectedCount ?? m.evidence.length,
      missionName: m.title,
      objectivesCompleted: correct ? m.objectives.length : Math.max(1, m.objectives.length - 1),
      objectivesTotal: m.objectives.length,
      findings: m.findings,
      summary: correct ? `Investigation completed: ${m.topic} issue identified using evidence.` : `Investigation completed with partial accuracy for ${m.topic}. Review the evidence explanation.`,
      sources: m.sources,
      detail: { correct, collectedCount: incoming.collectedCount },
    })
  }, [incoming, m])

  if (!m) return <Navigate to="/earth-guardians" replace />
  if (!view) {
    return (
      <PageShell backTo={`/mission/${m.id}/briefing`} backLabel="Briefing" className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl"><Panel className="p-6"><h1 className="font-[Space_Grotesk] text-2xl font-semibold">No saved report found</h1><p className="mt-2 text-text-muted">Complete the investigation to generate a report.</p><Link to={`/mission/${m.id}/briefing`}><Button variant="primary" className="mt-4">Open Briefing</Button></Link></Panel></div>
      </PageShell>
    )
  }

  const c = { correct: !!view.correct, accuracy: view.accuracy ?? 0, score: view.score ?? 0, collectedCount: view.collectedCount ?? m.evidence.length }
  return (
    <PageShell backTo="/earth-guardians" backLabel="Earth Guardians" className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <Panel className="p-6">
          <div className="hud-label text-success">Mission Report</div>
          <h1 className="mt-2 font-[Space_Grotesk] text-3xl font-semibold">{m.title}</h1>
          <p className="mt-2 text-sm text-text-muted">{view.fromSaved ? 'Showing your saved mission report. Refresh and direct navigation are supported.' : 'Report generated from your investigation.'}</p>
          <div className="mt-3 flex flex-wrap gap-2"><HudTag tone={c.correct ? 'green' : 'amber'}>{c.correct ? 'Objectives met' : 'Review recommended'}</HudTag><HudTag tone="cyan">Score {c.score}</HudTag><HudTag>Accuracy {c.accuracy}%</HudTag></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Panel className="bg-bg/25 p-4"><div className="hud-label">Scientific Findings</div><ul className="mt-3 space-y-2 text-sm text-text-muted">{m.findings.map((f) => <li key={f}>• {f}</li>)}</ul></Panel>
            <Panel className="bg-bg/25 p-4"><div className="hud-label">Rewards</div><div className="mt-3 text-sm text-text-muted">XP +{c.correct ? 220 : 110} · Research +{c.correct ? 80 : 35} · Discovery +{c.correct ? 90 : 40} · Observations {c.collectedCount}</div><div className="mt-4"><NasaSourceBadge sources={(saved?.sources?.length ? saved.sources : m.sources) as any} /></div></Panel>
          </div>
          <div className="mt-6 flex flex-wrap gap-3"><Link to={`/mission/${m.id}/briefing`}><Button variant="primary">Replay Mission</Button></Link><Link to="/mission-control"><Button>Mission Control</Button></Link><Link to="/achievements"><Button>View Reports</Button></Link></div>
        </Panel>
      </div>
    </PageShell>
  )
}
