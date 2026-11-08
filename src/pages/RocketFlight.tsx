import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { Link } from 'react-router-dom'
import { Compass, Database, Gauge, Play, Radar, Rocket, Scan, Sparkles } from 'lucide-react'
import { PageShell } from '../components/layout/PageShell'
import { Panel, HudTag } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/Progress'
import { loadState, saveState } from '../store/gameStore'
import { useSettings, prefersReducedMotion } from '../lib/settings'

type Phase = 'launch' | 'cruise' | 'approach' | 'research' | 'depart'
type POI = { id: string; name: string; kind: string; color: string; scale: number; facts: string[]; tasks: string[] }

const POIS: POI[] = [
  { id: 'iss', name: 'Orbital Research Station', kind: 'Station', color: '#cfe3ff', scale: 0.9, facts: ['Space stations support microgravity research and technology testing.', 'Continuous life support and power systems keep crews and instruments operating.'], tasks: ['Scan station systems', 'Collect telemetry snapshot', 'Log research status'] },
  { id: 'moon', name: 'Lunar Outpost Zone', kind: 'Moon', color: '#d8dde6', scale: 1.35, facts: ['The Moon preserves evidence of early Solar System history.', 'Lunar exploration helps test technologies for deeper space missions.'], tasks: ['Scan surface lighting', 'Capture terrain imagery', 'Analyze dust environment'] },
  { id: 'mars', name: 'Mars Observation Point', kind: 'Planet', color: '#d96b43', scale: 1.45, facts: ['Mars shows signs of ancient water-related processes.', 'Robotic missions study Martian geology, atmosphere, and climate history.'], tasks: ['Scan atmosphere trace', 'Capture surface imagery', 'Analyze geological signal'] },
  { id: 'asteroid', name: 'Asteroid Survey Target', kind: 'Asteroid', color: '#9ea7b3', scale: 0.8, facts: ['Asteroids are remnants from Solar System formation.', 'Studying them helps scientists understand materials and impact risks.'], tasks: ['Scan composition hint', 'Capture shape profile', 'Analyze rotation'] },
  { id: 'jupiter', name: 'Jupiter Magnetosphere Beacon', kind: 'Gas Giant', color: '#e0be8a', scale: 2.0, facts: ['Jupiter has a powerful magnetic field and many moons.', 'Its atmosphere reveals dynamics of giant planet systems.'], tasks: ['Scan radiation band', 'Capture cloud bands', 'Analyze magnetosphere data'] },
  { id: 'nebula', name: 'Nebula Science Region', kind: 'Deep Space', color: '#825BFF', scale: 1.8, facts: ['Nebulae contain gas and dust where stars can form.', 'Different wavelengths reveal different structures in nebulae.'], tasks: ['Scan emission signal', 'Capture spectral view', 'Analyze particle density'] },
]

function RocketModel({ thrust }: { thrust: number }) {
  return (
    <group rotation={[Math.PI / 2.2, 0, 0]}>
      <mesh position={[0, 0.6, 0]}>
        <coneGeometry args={[0.22, 0.7, 20]} />
        <meshStandardMaterial color="#eaf4ff" metalness={0.55} roughness={0.25} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.22, 0.26, 1.5, 20]} />
        <meshStandardMaterial color="#c9d8ea" metalness={0.45} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.82, 0]}>
        <cylinderGeometry args={[0.26, 0.18, 0.22, 16]} />
        <meshStandardMaterial color="#176BFF" emissive="#08244a" metalness={0.5} roughness={0.25} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[Math.cos((i * Math.PI) / 2) * 0.22, -0.45, Math.sin((i * Math.PI) / 2) * 0.22]} rotation={[0, 0, (i % 2 ? 0.25 : -0.25)]}>
          <boxGeometry args={[0.04, 0.42, 0.18]} />
          <meshStandardMaterial color="#00D9FF" emissive="#003b52" metalness={0.3} roughness={0.4} />
        </mesh>
      ))}
      {thrust > 0.05 && (
        <mesh position={[0, -1.08, 0]}>
          <coneGeometry args={[0.12 + thrust * 0.05, 0.45 + thrust * 0.25, 12]} />
          <meshBasicMaterial color={thrust > 0.6 ? '#ffd36d' : '#ff9a2f'} transparent opacity={0.85} />
        </mesh>
      )}
      <pointLight position={[0, -1.1, 0]} intensity={thrust * 2.2} distance={3} color="#ff9a2f" />
    </group>
  )
}

function TargetObject({ poi, phase }: { poi: POI; phase: Phase }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, d) => { if (ref.current) ref.current.rotation.y += d * 0.15 })
  const z = phase === 'cruise' || phase === 'launch' ? -22 : phase === 'approach' ? -9 : -5.5
  return (
    <group ref={ref} position={[2.2, 0.2, z]} scale={poi.scale * (phase === 'research' ? 1 : 0.85)}>
      <mesh>
        {poi.kind === 'Station' ? <boxGeometry args={[1.2, 0.35, 0.5]} /> : poi.kind === 'Asteroid' ? <dodecahedronGeometry args={[0.7, 0]} /> : <sphereGeometry args={[0.75, 28, 28]} />}
        <meshStandardMaterial color={poi.color} emissive={poi.color} emissiveIntensity={phase === 'research' ? 0.18 : 0.08} roughness={0.55} metalness={poi.kind === 'Station' ? 0.6 : 0.1} />
      </mesh>
      {phase === 'research' && <mesh rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[1.15, 1.25, 48]} /><meshBasicMaterial color="#00D9FF" transparent opacity={0.45} side={THREE.DoubleSide} /></mesh>}
    </group>
  )
}

function FlightScene({ phase, poi, thrust }: { phase: Phase; poi: POI; thrust: number }) {
  const group = useRef<THREE.Group>(null)
  const stars = useRef<THREE.Group>(null)
  useFrame((_, d) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const speed = phase === 'cruise' ? 8 : phase === 'approach' ? 3.5 : phase === 'depart' ? 9 : 0.25
    if (stars.current) stars.current.position.z = (stars.current.position.z + d * speed) % 20
    if (group.current) {
      group.current.position.y = Math.sin(Date.now() * 0.001) * (phase === 'research' ? 0.03 : 0.06)
      group.current.rotation.z = Math.sin(Date.now() * 0.0008) * 0.03
    }
  })
  return (
    <>
      <color attach="background" args={['#020611']} />
      <fog attach="fog" args={['#020611', 8, 35]} />
      <PerspectiveCamera makeDefault position={[0, 1.4, 5.8]} fov={55} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 5]} intensity={1.6} color="#eaf4ff" />
      <pointLight position={[-4, -1, -8]} intensity={0.8} color="#176BFF" />
      <group ref={stars}>
        <Stars radius={80} depth={40} count={3500} factor={3} saturation={0} fade speed={phase === 'research' ? 0.2 : 1.2} />
      </group>
      <group ref={group} position={[-1.4, -0.2, 0]}>
        <RocketModel thrust={thrust} />
      </group>
      <TargetObject poi={poi} phase={phase} />
      <mesh position={[0, -4, -10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[120, 120, 1, 1]} />
        <meshBasicMaterial color="#041025" transparent opacity={0.2} />
      </mesh>
    </>
  )
}

export function RocketFlight() {
  const { settings } = useSettings()
  const reduce = prefersReducedMotion(settings)
  const [started, setStarted] = useState(false)
  const [phase, setPhase] = useState<Phase>('launch')
  const [poiIndex, setPoiIndex] = useState(0)
  const [distance, setDistance] = useState(0)
  const [speed, setSpeed] = useState(0)
  const [energy, setEnergy] = useState(100)
  const [log, setLog] = useState<string[]>(['Systems ready. Launch when ready.'])
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({})
  const [discoveries, setDiscoveries] = useState(0)
  const phaseRef = useRef<Phase>('launch')
  const poi = POIS[poiIndex % POIS.length]

  useEffect(() => { phaseRef.current = phase }, [phase])

  useEffect(() => {
    if (!started) return
    let cancelled = false
    const wait = (ms: number) => new Promise((r) => setTimeout(r, reduce ? Math.min(ms, 250) : ms))
    const run = async () => {
      setPhase('launch'); setSpeed(1200); setLog((l) => [`Launch sequence: ${poi.name} set as next destination.`, ...l].slice(0, 6))
      await wait(1800); if (cancelled) return
      setPhase('cruise'); setSpeed(28400)
      await wait(4200); if (cancelled) return
      setPhase('approach'); setSpeed(4200); setLog((l) => [`Approaching ${poi.name}. Preparing station-keeping.`, ...l].slice(0, 6))
      await wait(2600); if (cancelled) return
      setPhase('research'); setSpeed(0); setCompletedTasks({}); setLog((l) => [`Arrived at ${poi.name}. Conduct research to continue.`, ...l].slice(0, 6))
    }
    run()
    return () => { cancelled = true }
  }, [started, poiIndex, poi.name, reduce])

  useEffect(() => {
    if (!started) return
    const id = window.setInterval(() => {
      setDistance((d) => d + (phaseRef.current === 'cruise' ? 37 : phaseRef.current === 'approach' ? 8 : phaseRef.current === 'depart' ? 42 : 0))
      setEnergy((e) => Math.min(100, e + (phaseRef.current === 'research' ? 0.8 : phaseRef.current === 'cruise' ? -0.15 : -0.05)))
    }, 250)
    return () => window.clearInterval(id)
  }, [started])

  const allDone = poi.tasks.every((t) => completedTasks[t])
  const doTask = (task: string) => {
    if (completedTasks[task] || phase !== 'research') return
    setCompletedTasks((p) => ({ ...p, [task]: true }))
    setLog((l) => [`${task} complete at ${poi.name}.`, ...l].slice(0, 6))
  }

  useEffect(() => {
    if (phase === 'research' && allDone) {
      setDiscoveries((d) => d + 1)
      const s = loadState()
      saveState({ ...s, profile: { ...s.profile, discoveryPoints: s.profile.discoveryPoints + 15, xp: s.profile.xp + 10, observations: s.profile.observations + 1 } })
      setLog((l) => [`Research complete: ${poi.name}. Discovery logged. Departing...`, ...l].slice(0, 6))
      const t = window.setTimeout(() => {
        setPhase('depart'); setSpeed(26000)
        window.setTimeout(() => {
          setPoiIndex((i) => i + 1)
          setStarted(true)
        }, reduce ? 350 : 1800)
      }, reduce ? 250 : 1200)
      return () => window.clearTimeout(t)
    }
  }, [allDone, phase, poi.name, reduce])

  const thrust = phase === 'launch' || phase === 'cruise' || phase === 'depart' ? 1 : phase === 'approach' ? 0.35 : 0

  return (
    <PageShell className="h-[100dvh] overflow-hidden">
      <div className="absolute inset-0">
        <Canvas dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
          <Suspense fallback={null}>
            <FlightScene phase={phase} poi={poi} thrust={thrust} />
          </Suspense>
        </Canvas>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,23,0.45),rgba(3,8,23,0.08)_35%,rgba(3,8,23,0.62))]" />
      <div className="relative z-10 flex h-full flex-col p-3 sm:p-4">
        <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-2">
          <Panel className="px-3 py-2"><span className="hud-label text-cyan">Play Game</span><span className="ml-2 font-[Space_Grotesk] font-semibold">Real Rocket Flight</span></Panel>
          <div className="flex gap-2"><HudTag tone={phase === 'research' ? 'amber' : 'green'}>{phase}</HudTag><HudTag tone="cyan">Continuous Mission</HudTag></div>
        </div>

        {!started && (
          <div className="pointer-events-auto flex flex-1 items-center justify-center p-4">
            <Panel className="max-w-xl p-6 text-center">
              <Rocket className="mx-auto text-cyan" size={34} />
              <h1 className="mt-3 font-[Space_Grotesk] text-3xl font-semibold">Rocket Flight: Space Explorer</h1>
              <p className="mt-3 text-sm leading-7 text-text-muted">Launch a rocket into space, fly through a live space environment, stop at different destinations to research and explore, then continue to the next target. The mission runs continuously.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3"><Button variant="primary" className="px-6 py-3" onClick={() => setStarted(true)}><Play size={16}/> Launch Rocket</Button><Link to="/mission-control"><Button>Mission Control</Button></Link></div>
            </Panel>
          </div>
        )}

        {started && (
          <>
            <div className="mt-3 grid gap-3 md:grid-cols-[280px_minmax(0,1fr)_300px] pointer-events-none md:pointer-events-auto">
              <Panel className="pointer-events-auto p-4">
                <div className="hud-label">Flight HUD</div>
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2"><div className="rounded-xl border border-white/8 bg-white/3 p-3"><div className="hud-label">Speed</div><div className="mt-1 font-[Orbitron] text-cyan">{speed.toLocaleString()}</div><div className="text-[11px] text-text-muted">km/h</div></div><div className="rounded-xl border border-white/8 bg-white/3 p-3"><div className="hud-label">Distance</div><div className="mt-1 font-[Orbitron] text-success">{distance.toLocaleString()}</div><div className="text-[11px] text-text-muted">km (sim)</div></div></div>
                  <div><div className="mb-1 flex justify-between text-xs text-text-muted"><span className="flex items-center gap-1"><Gauge size={13}/> Energy</span><span>{Math.round(energy)}%</span></div><ProgressBar value={energy} tone={energy > 30 ? 'cyan' : 'amber'} /></div>
                  <div className="rounded-xl border border-white/8 bg-white/3 p-3"><div className="hud-label">Discoveries</div><div className="mt-1 flex items-center gap-2 font-[Orbitron] text-amber"><Sparkles size={15}/> {discoveries}</div></div>
                </div>
              </Panel>
              <div className="hidden md:block" />
              <Panel className="pointer-events-auto p-4">
                <div className="hud-label">Current Destination</div>
                <div className="mt-2 font-[Space_Grotesk] text-xl font-semibold">{poi.name}</div>
                <div className="text-sm text-text-muted">{poi.kind}</div>
                <p className="mt-3 text-sm leading-6 text-text-muted">{poi.facts[0]}</p>
                {phase === 'research' ? (
                  <div className="mt-4 space-y-2">
                    <div className="hud-label text-amber">Research Tasks</div>
                    {poi.tasks.map((t) => (
                      <button key={t} type="button" onClick={() => doTask(t)} className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-sm ${completedTasks[t] ? 'border-success/30 bg-success/10 text-text' : 'border-cyan/20 bg-cyan/5 hover:border-cyan/40'}`}>
                        <span className="flex items-center gap-2"><Scan size={14} className={completedTasks[t] ? 'text-success' : 'text-cyan'}/> {t}</span>
                        {completedTasks[t] ? <HudTag tone="green">Done</HudTag> : <HudTag>Run</HudTag>}
                      </button>
                    ))}
                    {allDone && <div className="text-sm text-success">Research complete. Resuming flight automatically...</div>}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-cyan/15 bg-cyan/5 p-3 text-sm text-text-muted flex items-start gap-2"><Compass size={15} className="text-cyan mt-0.5"/> {phase === 'cruise' ? 'Rocket is flying through space. Next research stop is ahead.' : phase === 'approach' ? 'Slowing for station-keeping and research.' : phase === 'depart' ? 'Departing target. Next exploration destination loading...' : 'Preparing launch.'}</div>
                )}
              </Panel>
            </div>
            <div className="pointer-events-auto mt-auto grid gap-3 md:grid-cols-[1fr_300px]">
              <Panel className="p-3"><div className="hud-label">Mission Log</div><div className="mt-2 flex flex-wrap gap-2">{log.map((l, i) => <div key={i} className="rounded-lg border border-white/8 bg-white/3 px-2 py-1 text-xs text-text-muted">{l}</div>)}</div></Panel>
              <Panel className="p-3 flex flex-wrap items-center gap-2"><Link to="/explore"><Button><Radar size={15}/> Solar System</Button></Link><Link to="/mission-control"><Button><Database size={15}/> Control</Button></Link></Panel>
            </div>
          </>
        )}
      </div>
    </PageShell>
  )
}
