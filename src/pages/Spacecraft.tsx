import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Gauge, Navigation, Rocket, Target } from 'lucide-react'
import { PageShell } from '../components/layout/PageShell'
import { Panel, HudTag } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/Progress'
import { spacecraftCatalog, solarBodies } from '../data/catalog'
import { loadState, saveState, unlockAchievement } from '../store/gameStore'
import { useSettings, prefersReducedMotion } from '../lib/settings'

type Phase = 'select' | 'launch' | 'travel' | 'arrival'

export function Spacecraft() {
  const { settings } = useSettings()
  const reduceMotion = prefersReducedMotion(settings)
  const [craft, setCraft] = useState(spacecraftCatalog[0].id)
  const [target, setTarget] = useState('earth')
  const [phase, setPhase] = useState<Phase>('select')
  const [progress, setProgress] = useState(0)
  const [fuel, setFuel] = useState(100)
  const selectedCraft = useMemo(() => spacecraftCatalog.find((c) => c.id === craft)!, [craft])
  const targetBody = useMemo(() => solarBodies.find((b) => b.id === target) || solarBodies[3], [target])

  useEffect(() => {
    if (phase !== 'launch' && phase !== 'travel') return
    const id = window.setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + (phase === 'launch' ? 8 : 3))
        if (phase === 'launch' && next >= 100) { setPhase('travel'); return 0 }
        if (phase === 'travel' && next >= 100) {
          setPhase('arrival')
          const s = loadState()
          saveState({ ...s, profile: { ...s.profile, spacecraft: selectedCraft.name, discoveryPoints: s.profile.discoveryPoints + 15 } })
          unlockAchievement(loadState(), 'launch-commander')
        }
        return next
      })
      setFuel((f) => Math.max(12, f - (phase === 'launch' ? 1.8 : 0.6)))
    }, 220)
    return () => window.clearInterval(id)
  }, [phase, selectedCraft.name])

  const reset = () => { setPhase('select'); setProgress(0); setFuel(100) }

  return (
    <PageShell backTo="/mission-control" backLabel="Mission Control" className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <Panel className="p-6"><div className="hud-label text-cyan">Spacecraft & Space Exploration</div><h1 className="mt-2 font-[Space_Grotesk] text-3xl font-semibold">Flight Operations</h1></Panel>
        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <Panel className="p-5">
            <div className="hud-label">Spacecraft Selection</div>
            <div className="mt-3 space-y-2">{spacecraftCatalog.map((c) => (
              <button key={c.id} type="button" disabled={phase !== 'select'} onClick={() => setCraft(c.id)} className={`w-full rounded-xl border p-3 text-left ${craft === c.id ? 'border-cyan/45 bg-cyan/10' : 'border-white/8 bg-white/3'} disabled:opacity-70`}>
                <div className="flex items-center justify-between"><span className="font-semibold">{c.name}</span><HudTag tone="green">{c.status}</HudTag></div>
                <div className="mt-1 text-sm text-text-muted">{c.role} · Speed {c.speed} · Range {c.range}</div>
              </button>
            ))}</div>
            <div className="hud-label mt-5">Target Selection</div>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{solarBodies.filter(b => b.id !== 'sun').map((b) => <button key={b.id} type="button" disabled={phase !== 'select'} onClick={() => setTarget(b.id)} className={`rounded-lg border px-2 py-2 text-sm ${target === b.id ? 'border-cyan/40 bg-cyan/10' : 'border-white/8 bg-white/3'}`}>{b.name}</button>)}</div>
          </Panel>
          <Panel className="relative overflow-hidden p-5">
            <div className="absolute inset-0 bg-[radial-gradient(500px_220px_at_70%_30%,rgba(23,107,255,0.2),transparent_60%)]" />
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-2"><div className="hud-label">Mission Objectives</div><HudTag tone={phase === 'arrival' ? 'green' : 'cyan'}>{phase}</HudTag></div>
              <ol className="mt-3 space-y-1 text-sm text-text-muted">
                <li>1. Select spacecraft and target destination.</li>
                <li>2. Launch and monitor spacecraft systems.</li>
                <li>3. Travel, manage status, and arrive at the target.</li>
                <li>4. Record exploration discovery.</li>
              </ol>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/8 bg-white/3 p-3"><div className="hud-label">Speed</div><div className="mt-2 flex items-center gap-2 font-[Orbitron] text-cyan"><Gauge size={15}/> {phase === 'travel' ? '28,400' : phase === 'launch' ? '7,900' : '0'} km/h</div></div>
                <div className="rounded-xl border border-white/8 bg-white/3 p-3"><div className="hud-label">Fuel</div><div className="mt-2 font-[Orbitron] text-amber">{Math.round(fuel)}%</div></div>
                <div className="rounded-xl border border-white/8 bg-white/3 p-3"><div className="hud-label">Target</div><div className="mt-2 flex items-center gap-2 font-semibold"><Target size={15} className="text-cyan"/> {targetBody.name}</div></div>
              </div>
              <motion.div className="mt-6 rounded-2xl border border-cyan/20 bg-[linear-gradient(180deg,rgba(0,217,255,0.05),rgba(8,22,43,0.35))] p-5" animate={!reduceMotion && (phase === 'launch' || phase === 'travel') ? { y: [0, -4, 0] } : { y: 0 }} transition={!reduceMotion && phase !== 'arrival' ? { repeat: Infinity, duration: 1.8 } : { duration: 0 }}>
                <div className="flex items-center gap-3"><Navigation className="text-cyan" /><div><div className="font-[Space_Grotesk] text-xl font-semibold">{selectedCraft.name}</div><div className="text-sm text-text-muted">{phase === 'select' ? 'Ready on launch platform.' : phase === 'launch' ? 'Launch sequence active.' : phase === 'travel' ? `En route to ${targetBody.name}.` : `Arrival confirmed at ${targetBody.name}. Discovery logged.`}</div></div></div>
                {(phase === 'launch' || phase === 'travel') && <div className="mt-4"><div className="mb-1 flex justify-between text-xs text-text-muted"><span>{phase === 'launch' ? 'Launch sequence' : 'Travel progress'}</span><span>{Math.round(progress)}%</span></div><ProgressBar value={progress} tone="cyan" /></div>}
              </motion.div>
              <div className="mt-5 flex flex-wrap gap-3">
                {phase === 'select' && <><Button variant="primary" onClick={() => setPhase('launch')}><Rocket size={16}/> Launch Spacecraft</Button><Button variant="success" onClick={() => window.location.assign('/play')}>Play Rocket Flight Game</Button></>}
                {phase === 'arrival' && <><Button variant="success" onClick={() => window.location.assign(`/explore`)}>Explore Discovery</Button><Button onClick={reset}>New Flight</Button><Button onClick={() => window.location.assign('/play')}>Play Game</Button></>}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  )
}
