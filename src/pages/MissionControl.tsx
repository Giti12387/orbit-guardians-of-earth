import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, Compass, Rocket, Satellite, ShieldCheck, Sparkles } from 'lucide-react'
import { PageShell } from '../components/layout/PageShell'
import { Panel, HudTag } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/Progress'
import { loadState } from '../store/gameStore'
import { coastalWatchMission } from '../data/missions'

export function MissionControl() {
  const state = useMemo(() => loadState(), [])
  const m = coastalWatchMission
  const mp = state.missions[m.id]
  return (
    <PageShell backTo="/" backLabel="Main Menu" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_500px_at_75%_20%,rgba(23,107,255,0.16),transparent_55%),radial-gradient(800px_400px_at_15%_75%,rgba(0,217,255,0.1),transparent_60%)]" />
      <div className="relative mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="hud-label text-cyan">Command Center</div>
            <h1 className="mt-2 font-[Space_Grotesk] text-3xl font-semibold text-text sm:text-4xl">Mission Control</h1>
            <p className="mt-2 max-w-2xl text-text-muted">Advanced space station overview for Earth observation, spacecraft readiness, and scientific missions.</p>
          </div>
          <Panel className="flex items-center gap-4 px-4 py-3">
            <div className="text-right">
              <div className="hud-label">Station Status</div>
              <div className="mt-1 flex items-center gap-2 text-sm text-success"><ShieldCheck size={15} /> Systems Nominal</div>
            </div>
          </Panel>
        </motion.div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <Panel className="scanline overflow-hidden p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="hud-label">Featured Mission</div>
                  <h2 className="mt-2 font-[Space_Grotesk] text-2xl font-semibold">{m.title}: {m.codename}</h2>
                </div>
                <HudTag tone={mp?.status === 'completed' ? 'green' : 'amber'}>{mp?.status === 'completed' ? 'Completed' : 'Ready'}</HudTag>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-text-muted">{m.summary}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/8 bg-white/3 p-3">
                  <div className="hud-label">Category</div>
                  <div className="mt-2 text-sm text-text">{m.category}</div>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/3 p-3">
                  <div className="hud-label">Difficulty</div>
                  <div className="mt-2 text-sm text-text">{m.difficulty}</div>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/3 p-3">
                  <div className="hud-label">Duration</div>
                  <div className="mt-2 text-sm text-text">{m.duration}</div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/mission/coastal-watch/briefing"><Button variant="primary"><Rocket size={16} /> Launch Briefing</Button></Link>
                <Link to="/explore"><Button><Compass size={16} /> Explore Universe</Button></Link>
              </div>
            </Panel>

            <div className="grid gap-4 sm:grid-cols-2">
              <Panel className="p-5">
                <div className="hud-label">Spacecraft Status</div>
                <div className="mt-4 space-y-3">
                  {[{ label: 'Observation Array', value: 92 }, { label: 'Navigation', value: 100 }, { label: 'Power Reserves', value: 86 }].map((s) => (
                    <div key={s.label}>
                      <div className="mb-1 flex justify-between text-xs text-text-muted"><span>{s.label}</span><span>{s.value}%</span></div>
                      <ProgressBar value={s.value} tone={s.value > 90 ? 'green' : 'cyan'} />
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel className="p-5">
                <div className="hud-label">Recent Discoveries</div>
                <ul className="mt-4 space-y-3 text-sm text-text-muted">
                  <li className="flex gap-2"><Sparkles size={15} className="mt-0.5 text-cyan" /> Coastal observation layers can reveal water and vegetation patterns.</li>
                  <li className="flex gap-2"><Satellite size={15} className="mt-0.5 text-cyan" /> Comparing observations over time helps scientists detect real change.</li>
                  <li className="flex gap-2"><Activity size={15} className="mt-0.5 text-cyan" /> Training complete data can be reviewed in the mission report.</li>
                </ul>
              </Panel>
            </div>
          </div>

          <div className="space-y-4">
            <Panel className="p-5">
              <div className="hud-label">Player Statistics</div>
              <div className="mt-3 font-[Space_Grotesk] text-xl font-semibold">{state.profile.callsign}</div>
              <div className="text-sm text-text-muted">{state.profile.rank} · Level {state.profile.level}</div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  ['XP', state.profile.xp],
                  ['Research', state.profile.researchPoints],
                  ['Missions', state.profile.missionsCompleted],
                  ['Observations', state.profile.observations],
                ].map(([k, v]) => (
                  <div key={String(k)} className="rounded-xl border border-white/8 bg-white/3 p-3">
                    <div className="hud-label">{k}</div>
                    <div className="mt-2 font-[Orbitron] text-lg text-cyan">{v}</div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel className="p-5">
              <div className="hud-label">Mission Objectives</div>
              <ol className="mt-4 space-y-2 text-sm leading-6 text-text-muted">
                {m.objectives.map((o, i) => (
                  <li key={o} className="flex gap-3"><span className="font-[Orbitron] text-xs text-cyan">0{i + 1}</span><span>{o}</span></li>
                ))}
              </ol>
            </Panel>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
