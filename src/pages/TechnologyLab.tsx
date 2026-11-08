import { useState } from 'react'
import { PageShell } from '../components/layout/PageShell'
import { Panel, HudTag } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { techItems } from '../data/content'

export function TechnologyLab() {
  const [active, setActive] = useState(techItems[0].id)
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({})
  const item = techItems.find((t) => t.id === active) || techItems[0]
  return (
    <PageShell backTo="/mission-control" backLabel="Mission Control" className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <Panel className="p-6"><div className="hud-label text-violet">Future Technology Lab</div><h1 className="mt-2 font-[Space_Grotesk] text-3xl font-semibold">Research & Exploration Technology</h1></Panel>
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <Panel className="p-3">{techItems.map((t) => <button key={t.id} type="button" onClick={() => setActive(t.id)} className={`mb-1 w-full rounded-xl px-3 py-3 text-left ${active === t.id ? 'bg-violet/12 ring-1 ring-violet/25' : 'hover:bg-white/4'}`}><div className="font-semibold">{t.title}</div><div className="text-xs text-text-muted">{t.category} {reviewed[t.id] ? '· Reviewed' : ''}</div></button>)}</Panel>
          <Panel className="p-6">
            <div className="flex flex-wrap items-center gap-2"><HudTag tone="violet">{item.category}</HudTag>{reviewed[item.id] && <HudTag tone="green">Reviewed</HudTag>}</div>
            <h2 className="mt-3 font-[Space_Grotesk] text-2xl font-semibold">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-text-muted">{item.desc}</p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">{item.points.map((p) => <div key={p} className="rounded-xl border border-white/8 bg-[linear-gradient(180deg,rgba(130,91,255,0.08),rgba(8,22,43,0.3))] p-4 text-sm leading-6 text-text-muted"><div className="mb-2 h-8 w-8 rounded-lg border border-violet/25 bg-violet/10" />{p}</div>)}</div>
            <div className="mt-5 rounded-xl border border-cyan/20 bg-cyan/5 p-4 text-sm text-text-muted">Educational demonstration: ORBIT presents interactive information panels and simulated technology status to explain how satellites, spacecraft, robotics, and AI support scientific missions.</div>
            <div className="mt-4"><Button variant={reviewed[item.id] ? 'secondary' : 'primary'} onClick={() => setReviewed((r) => ({ ...r, [item.id]: !r[item.id] }))}>{reviewed[item.id] ? 'Mark as Unreviewed' : 'Mark Module Reviewed'}</Button></div>
          </Panel>
        </div>
      </div>
    </PageShell>
  )
}
