import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, FileSearch, Send } from 'lucide-react'
import { PageShell } from '../components/layout/PageShell'
import { Panel, HudTag } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { NasaSourceBadge } from '../components/ui/NasaSourceBadge'
import { getInvestigationMission } from '../data/earthGuardiansMissions'

export function InvestigationMission() {
  const { missionId } = useParams()
  const nav = useNavigate()
  const m = missionId ? getInvestigationMission(missionId) : undefined
  const [collected, setCollected] = useState<Record<string, boolean>>({})
  const [choice, setChoice] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const allCollected = useMemo(() => !!m && m.evidence.every((e) => collected[e.id]), [m, collected])
  const selected = m?.options.find((o) => o.id === choice)
  if (!m) return <Navigate to="/earth-guardians" replace />

  const submit = () => {
    if (!choice || !allCollected) return
    setSubmitted(true)
  }
  const finish = () => {
    const correct = !!selected?.correct
    const accuracy = correct ? 100 : 45
    const score = correct ? 920 : 420
    const completionId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    nav(`/mission/${m.id}/results`, { state: { completionId, choice, correct, accuracy, score, collectedCount: m.evidence.length } })
  }

  return (
    <PageShell backTo={`/mission/${m.id}/briefing`} backLabel="Briefing" className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <Panel className="p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="hud-label" style={{ color: m.accent }}>Active Investigation</div><h1 className="font-[Space_Grotesk] text-2xl font-semibold">{m.title}</h1></div><HudTag tone="amber">Evidence-based analysis</HudTag></div></Panel>
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <Panel className="p-5">
            <div className="hud-label">Observations & Evidence</div>
            <p className="mt-2 text-sm text-text-muted">Collect each evidence item before submitting your conclusion. Compare sources, dates, and values.</p>
            <div className="mt-4 space-y-3">
              {m.evidence.map((e) => (
                <div key={e.id} className={`rounded-xl border p-4 ${collected[e.id] ? 'border-success/30 bg-success/7' : 'border-white/8 bg-white/3'}`}>
                  <div className="flex items-start justify-between gap-3"><div><div className="font-semibold text-text">{e.label}</div><div className="mt-1 text-sm text-text-muted">{e.value}</div></div>{collected[e.id] ? <CheckCircle2 className="text-success" size={18} /> : <Button onClick={() => setCollected((p) => ({ ...p, [e.id]: true }))}><FileSearch size={15} /> Collect</Button>}</div>
                  <div className="mt-2 text-xs text-text-muted">Source: {e.source} · Date: {e.date} · <span className={e.sourceType === 'simulated' ? 'text-amber' : 'text-cyan'}>{e.sourceType}</span></div>
                </div>
              ))}
            </div>
          </Panel>
          <div className="space-y-4">
            <Panel className="p-5">
              <div className="hud-label">Mission Report Decision</div>
              <p className="mt-3 text-sm font-medium text-text">{m.question}</p>
              <div className="mt-4 space-y-2">
                {m.options.map((o) => (
                  <button key={o.id} type="button" disabled={submitted} onClick={() => setChoice(o.id)} className={`w-full rounded-xl border p-3 text-left text-sm transition ${choice === o.id ? 'border-cyan/45 bg-cyan/10' : 'border-white/8 bg-white/3 hover:border-white/15'} disabled:opacity-80`}>
                    {o.label}
                  </button>
                ))}
              </div>
              {submitted && selected && (
                <div className={`mt-4 rounded-xl border p-3 text-sm ${selected.correct ? 'border-success/30 bg-success/10 text-text-muted' : 'border-amber/30 bg-amber/10 text-text-muted'}`}>
                  <div className={selected.correct ? 'font-semibold text-success' : 'font-semibold text-amber'}>{selected.correct ? 'Conclusion supported by evidence' : 'Conclusion needs revision'}</div>
                  <p className="mt-1">{selected.why}</p>
                </div>
              )}
              <div className="mt-4 flex gap-2">
                {!submitted ? <Button variant="primary" className="w-full" disabled={!allCollected || !choice} onClick={submit}><Send size={15} /> Submit Report</Button> : <Button variant="success" className="w-full" onClick={finish}>View Mission Results</Button>}
              </div>
              {!allCollected && <p className="mt-2 text-xs text-amber">Collect all evidence items before submitting.</p>}
            </Panel>
            <Panel className="p-5"><NasaSourceBadge sources={m.sources} /></Panel>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
