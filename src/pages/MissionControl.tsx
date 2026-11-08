import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, Compass, Database, Globe, Rocket, Satellite, ShieldCheck, Sparkles, Trophy } from 'lucide-react'
import { PageShell } from '../components/layout/PageShell'
import { Panel, HudTag } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/Progress'
import { NasaSourceBadge } from '../components/ui/NasaSourceBadge'
import { loadState } from '../store/gameStore'
import { investigationMissions } from '../data/earthGuardiansMissions'
import { achievementsCatalog, spacecraftCatalog, satelliteCatalog } from '../data/catalog'
import { fetchEonetStatus, NASA_SOURCES } from '../lib/nasaData'

export function MissionControl() {
  const state = useMemo(() => loadState(), [])
  const [eonet, setEonet] = useState<{ state: string; message: string; date?: string }>({ state: 'loading', message: 'Checking NASA EONET...' })
  useEffect(() => { const ac = new AbortController(); fetchEonetStatus(ac.signal).then(r => setEonet({ state: r.ok ? 'ok' : 'fallback', message: r.message, date: r.date })).catch(()=>{}); return () => ac.abort() }, [])
  const missions = [{ id: 'coastal-watch', title: 'Coastal Watch', topic: 'Coastal changes', to: '/mission/coastal-watch/briefing' }, ...investigationMissions.map(m => ({ id: m.id, title: m.title, topic: m.topic, to: `/mission/${m.id}/briefing` }))]
  const available = missions.filter(m => state.missions[m.id]?.status !== 'completed')
  const completed = missions.filter(m => state.missions[m.id]?.status === 'completed')
  const craft = spacecraftCatalog.find(c => c.name === state.profile.spacecraft) || spacecraftCatalog[0]
  const sat = satelliteCatalog.find(s => s.name === state.profile.activeSatellite) || satelliteCatalog[0]

  return (
    <PageShell backTo="/" backLabel="Main Menu" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_500px_at_75%_20%,rgba(23,107,255,0.16),transparent_55%),radial-gradient(800px_400px_at_15%_75%,rgba(0,217,255,0.1),transparent_60%)]" />
      <div className="relative mx-auto max-w-7xl space-y-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4">
          <div><div className="hud-label text-cyan">Command Center</div><h1 className="mt-2 font-[Space_Grotesk] text-3xl font-semibold sm:text-4xl">Mission Control</h1><p className="mt-2 max-w-2xl text-text-muted">Player progress, missions, spacecraft, satellites, Earth status, discoveries, and navigation.</p></div>
          <Panel className="flex items-center gap-4 px-4 py-3"><div className="text-right"><div className="hud-label">Station Status</div><div className="mt-1 flex items-center gap-2 text-sm text-success"><ShieldCheck size={15} /> Systems Nominal</div></div></Panel>
        </motion.div>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr_0.95fr]">
          <Panel className="p-5">
            <div className="hud-label">Player Profile & Level</div>
            <div className="mt-2 font-[Space_Grotesk] text-2xl font-semibold">{state.profile.callsign}</div>
            <div className="text-sm text-text-muted">{state.profile.rank} · Level {state.profile.level}</div>
            <div className="mt-4"><div className="mb-1 flex justify-between text-xs text-text-muted"><span>Experience</span><span>{state.profile.xp % 500}/500</span></div><ProgressBar value={((state.profile.xp % 500)/500)*100} /></div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">{[['XP',state.profile.xp],['Research',state.profile.researchPoints],['Discovery',state.profile.discoveryPoints],['Observations',state.profile.observations]].map(([k,v])=> <div key={String(k)} className="rounded-xl border border-white/8 bg-white/3 p-3"><div className="hud-label">{k}</div><div className="mt-1 font-[Orbitron] text-cyan">{v}</div></div>)}</div>
          </Panel>
          <Panel className="p-5"><div className="hud-label">Spacecraft Status</div><div className="mt-2 text-lg font-semibold">{craft.name}</div><div className="text-sm text-text-muted">{craft.role}</div><div className="mt-4 space-y-3"><div><div className="mb-1 flex justify-between text-xs text-text-muted"><span>Readiness</span><span>98%</span></div><ProgressBar value={98} tone="green"/></div><div><div className="mb-1 flex justify-between text-xs text-text-muted"><span>Navigation</span><span>100%</span></div><ProgressBar value={100} tone="cyan"/></div></div><Link to="/spacecraft" className="mt-4 block"><Button className="w-full"><Rocket size={15}/> Open Spacecraft</Button></Link></Panel>
          <Panel className="p-5"><div className="hud-label">Satellite & Earth Status</div><div className="mt-2 text-lg font-semibold">{sat.name}</div><div className="text-sm text-text-muted">{sat.orbit}</div><div className="mt-4 rounded-xl border border-white/8 bg-white/3 p-3 text-sm"><div className="flex items-center justify-between"><span>Earth status</span><HudTag tone="amber">Monitoring active</HudTag></div><div className="mt-2 text-text-muted">NASA EONET check: {eonet.state} — {eonet.message}</div></div><Link to="/satellite-operations" className="mt-4 block"><Button className="w-full"><Satellite size={15}/> Satellite Operations</Button></Link></Panel>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Panel className="p-5">
            <div className="flex items-center justify-between"><div className="hud-label">Available & Completed Missions</div><HudTag tone="green">{completed.length}/{missions.length} completed</HudTag></div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div><div className="hud-label mb-2">Available</div><div className="space-y-2">{available.slice(0,6).map(m => <Link key={m.id} to={m.to} className="block rounded-xl border border-white/8 bg-white/3 p-3 hover:border-cyan/30"><div className="font-semibold">{m.title}</div><div className="text-xs text-text-muted">{m.topic}</div></Link>)}{!available.length && <div className="text-sm text-text-muted">All missions completed.</div>}</div></div>
              <div><div className="hud-label mb-2">Completed</div><div className="space-y-2">{completed.slice(0,6).map(m => <div key={m.id} className="rounded-xl border border-success/20 bg-success/5 p-3"><div className="font-semibold">{m.title}</div><div className="text-xs text-success">Score {state.missions[m.id]?.score} · Accuracy {state.missions[m.id]?.accuracy}%</div></div>)}{!completed.length && <div className="text-sm text-text-muted">No completed missions yet.</div>}</div></div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2"><Link to="/earth-guardians"><Button variant="primary"><Activity size={15}/> Earth Guardians</Button></Link><Link to="/explore"><Button><Compass size={15}/> Explore Universe</Button></Link></div>
          </Panel>
          <div className="space-y-4">
            <Panel className="p-5"><div className="hud-label">Achievements & Scientific Discoveries</div><div className="mt-3 flex flex-wrap gap-2">{achievementsCatalog.map(a => <HudTag key={a.id} tone={state.achievements.includes(a.id) ? 'green' : 'amber'}>{a.name}</HudTag>)}</div><div className="mt-3 text-sm text-text-muted">Discovery points: <span className="text-cyan font-[Orbitron]">{state.profile.discoveryPoints}</span>. Completed investigations generate reports and scientific findings.</div><Link to="/achievements" className="mt-3 inline-block"><Button><Trophy size={15}/> View Reports</Button></Link></Panel>
            <Panel className="p-5"><div className="hud-label">Mission History</div><div className="mt-3 space-y-2">{state.reports.slice(0,4).map(r => <div key={r.id} className="rounded-lg border border-white/8 bg-white/3 p-2 text-sm"><div className="font-semibold">{r.missionName}</div><div className="text-xs text-text-muted">{new Date(r.completedAt).toLocaleDateString()} · {r.score} pts</div></div>)}{!state.reports.length && <div className="text-sm text-text-muted">No reports yet.</div>}</div></Panel>
          </div>
        </div>

        <Panel className="p-5">
          <div className="hud-label">Navigation</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{[['/explore','Solar System',Globe],['/spacecraft','Spacecraft',Rocket],['/satellite-operations','Satellite Ops',Satellite],['/earth-guardians','Earth Guardians',Activity],['/technology-lab','Technology Lab',Sparkles],['/learning','Learning Center',Database],['/achievements','Achievements',Trophy],['/settings','Settings',Compass]].map(([to,label,Icon]:any)=>(<Link key={to} to={to}><Button className="w-full justify-start"><Icon size={15}/> {label}</Button></Link>))}</div>
          <div className="mt-5"><NasaSourceBadge sources={[{name: NASA_SOURCES.eonet.name, date: eonet.date || new Date().toISOString().slice(0,10), type: eonet.state==='ok'?'real':'simulated', url: NASA_SOURCES.eonet.url, note: eonet.state==='ok'?'Live API check':'Fallback/demo-safe status'},{name: NASA_SOURCES.gibs.name, date: 'Referenced', type:'archived', url: NASA_SOURCES.gibs.url},{name: NASA_SOURCES.earthObservatory.name, date:'Referenced', type:'archived', url: NASA_SOURCES.earthObservatory.url}]} /></div>
        </Panel>
      </div>
    </PageShell>
  )
}
