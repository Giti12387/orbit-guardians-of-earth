import { PageShell } from '../components/layout/PageShell'
import { Panel, HudTag } from '../components/ui/Panel'
import { loadState } from '../store/gameStore'
import { achievementsCatalog } from '../data/catalog'

export function Achievements() {
  const state = loadState()
  return (
    <PageShell backTo="/mission-control" backLabel="Mission Control" className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <Panel className="p-6"><div className="hud-label text-cyan">Progress</div><h1 className="mt-2 font-[Space_Grotesk] text-3xl font-semibold">Achievements & Discoveries</h1></Panel>
        <div className="grid gap-4 md:grid-cols-2">
          {achievementsCatalog.map((a) => {
            const unlocked = state.achievements.includes(a.id)
            return (
              <Panel key={a.id} className={`p-5 ${unlocked ? 'border-success/25' : 'opacity-80'}`}>
                <div className="flex items-center justify-between"><div className="font-[Space_Grotesk] text-lg font-semibold">{a.name}</div><HudTag tone={unlocked ? 'green' : 'amber'}>{unlocked ? 'Unlocked' : 'Locked'}</HudTag></div>
                <p className="mt-2 text-sm text-text-muted">{a.desc}</p>
              </Panel>
            )
          })}
        </div>
        <Panel className="p-5"><div className="hud-label">Mission Reports</div>
          <div className="mt-4 space-y-3">{state.reports.length ? state.reports.slice(0, 8).map((r) => (
            <div key={r.id} className="rounded-xl border border-white/8 bg-white/3 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-text">{r.missionName}</span><HudTag tone={r.accuracy >= 67 ? 'green' : 'amber'}>{r.score} pts</HudTag></div>
              <div className="mt-1 text-text-muted">{new Date(r.completedAt).toLocaleString()} · Accuracy {r.accuracy}% · {r.observationsCollected} observations</div>
            </div>
          )) : <p className="text-sm text-text-muted">No mission reports yet. Complete a mission to generate one.</p>}</div>
        </Panel>
      </div>
    </PageShell>
  )
}
