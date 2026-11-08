import { Link } from 'react-router-dom'
import { AlertTriangle, CloudRain, Droplets, Flame, Leaf, ThermometerSun, Waves, Radar } from 'lucide-react'
import { PageShell } from '../components/layout/PageShell'
import { Panel, HudTag } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { loadState } from '../store/gameStore'
import { investigationMissions } from '../data/earthGuardiansMissions'

const icons: Record<string, any> = { 'heatwave-watch': ThermometerSun, 'forest-change': Leaf, 'wildfire-response': Flame, 'ocean-conditions': Waves, 'storm-tracker': CloudRain, 'drought-signals': Droplets, 'environmental-monitoring': Radar }

export function EarthGuardians() {
  const state = loadState()
  return (
    <PageShell backTo="/mission-control" backLabel="Mission Control" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <Panel className="p-6">
          <div className="hud-label text-success">Earth Guardians</div>
          <h1 className="mt-2 font-[Space_Grotesk] text-3xl font-semibold">Environmental Investigation Missions</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-text-muted">Select a mission, review the briefing, examine observations and evidence, identify the environmental issue, and submit a mission report. Coastal Watch (coastal changes) is available as a full 3D observation mission.</p>
        </Panel>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Panel className="p-5 border-success/25">
            <div className="flex items-center justify-between"><div className="font-[Space_Grotesk] text-xl font-semibold">Coastal Watch</div><HudTag tone="green">Coastal Changes</HudTag></div>
            <p className="mt-2 text-sm text-text-muted">Investigate shoreline, water, vegetation, and thermal patterns from orbit.</p>
            <div className="mt-4 flex gap-2"><Link to="/mission/coastal-watch/briefing" className="flex-1"><Button variant="primary" className="w-full">Open Briefing</Button></Link></div>
            {state.missions['coastal-watch']?.status === 'completed' && <div className="mt-3 text-xs text-success">Completed · Best score {state.missions['coastal-watch'].score}</div>}
          </Panel>
          {investigationMissions.map((m) => {
            const Icon = icons[m.id] || AlertTriangle
            const prog = state.missions[m.id]
            return (
              <Panel key={m.id} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3"><div className="rounded-xl border border-white/10 bg-white/5 p-2" style={{ color: m.accent }}><Icon size={18} /></div><div><div className="font-[Space_Grotesk] text-lg font-semibold">{m.title}</div><div className="text-xs text-text-muted">{m.topic}</div></div></div>
                  <HudTag tone={prog?.status === 'completed' ? 'green' : 'amber'}>{prog?.status === 'completed' ? 'Done' : 'Ready'}</HudTag>
                </div>
                <p className="mt-3 text-sm leading-6 text-text-muted">{m.briefing}</p>
                <div className="mt-4 flex gap-2"><Link to={`/mission/${m.id}/briefing`} className="flex-1"><Button className="w-full">Briefing & Mission</Button></Link></div>
                {prog?.status === 'completed' && <div className="mt-3 text-xs text-success">Best score {prog.score} · Accuracy {prog.accuracy}%</div>}
              </Panel>
            )
          })}
        </div>
      </div>
    </PageShell>
  )
}
