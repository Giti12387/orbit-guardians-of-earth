import { useState } from 'react'
import { PageShell } from '../components/layout/PageShell'
import { Panel, HudTag } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { learningTopics } from '../data/content'

export function LearningCenter() {
  const [active, setActive] = useState(learningTopics[0].id)
  const [checks, setChecks] = useState<Record<string, number>>({})
  const t = learningTopics.find((x) => x.id === active) || learningTopics[0]
  const understood = checks[t.id] || 0
  return (
    <PageShell backTo="/mission-control" backLabel="Mission Control" className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <Panel className="p-6"><div className="hud-label text-cyan">Learning & Scientific Discovery Center</div><h1 className="mt-2 font-[Space_Grotesk] text-3xl font-semibold">Understand Space and Earth Science</h1><p className="mt-2 text-sm text-text-muted">Scientifically responsible explanations for students and explorers.</p></Panel>
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <Panel className="p-3">{learningTopics.map((x) => <button key={x.id} type="button" onClick={() => setActive(x.id)} className={`mb-1 w-full rounded-xl px-3 py-3 text-left ${active === x.id ? 'bg-cyan/10 ring-1 ring-cyan/25' : 'hover:bg-white/4'}`}><div className="font-semibold">{x.title}</div><div className="text-xs text-text-muted">{x.summary}</div></button>)}</Panel>
          <Panel className="p-6">
            <HudTag tone="cyan">{t.title}</HudTag>
            <h2 className="mt-3 font-[Space_Grotesk] text-2xl font-semibold">{t.summary}</h2>
            <div className="mt-5 space-y-3">{t.bullets.map((b) => <div key={b} className="rounded-xl border border-white/8 bg-white/3 p-4 text-sm leading-7 text-text-muted">{b}</div>)}</div>
            <div className="mt-5 rounded-xl border border-white/8 bg-white/3 p-4">
              <div className="hud-label">Learning Check</div>
              <p className="mt-2 text-sm text-text-muted">Reflect on the key ideas, then mark your understanding. This helps guide your next mission.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant={understood >= 1 ? 'success' : 'secondary'} onClick={() => setChecks((c) => ({ ...c, [t.id]: 1 }))}>I can explain this</Button>
                <Button variant={understood >= 2 ? 'success' : 'secondary'} onClick={() => setChecks((c) => ({ ...c, [t.id]: 2 }))}>Ready to apply in a mission</Button>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  )
}
