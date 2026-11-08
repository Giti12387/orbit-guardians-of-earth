import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Heart, Pause, Play, Rocket, RotateCcw, Sparkles, Zap } from 'lucide-react'
import { PageShell } from '../components/layout/PageShell'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/Progress'
import { loadState, saveState } from '../store/gameStore'

type ObjKind = 'asteroid' | 'energy' | 'data' | 'milestone'
type GameObj = { id: number; kind: ObjKind; x: number; y: number; z: number; r: number; spin: number; hit?: boolean; label?: string; color: string }
type Hud = { score: number; hull: number; energy: number; distance: number; combo: number; msg: string; discoveries: string[]; over: boolean; paused: boolean }

const MILESTONES = [
  { label: 'Moon Research Zone', color: '#d8dde6' },
  { label: 'Mars Signal Zone', color: '#ff7a45' },
  { label: 'Asteroid Survey', color: '#9ea7b3' },
  { label: 'Jupiter Beacon', color: '#e0be8a' },
  { label: 'Nebula Scan', color: '#825BFF' },
  { label: 'Earth Relay', color: '#46E58A' },
]

function RocketMesh({ input }: { input: React.MutableRefObject<{ x: number; y: number; boost: boolean }> }) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh position={[0, 0.1, 0]}><coneGeometry args={[0.28, 0.85, 18]} /><meshStandardMaterial color="#eaf4ff" metalness={0.6} roughness={0.2} /></mesh>
      <mesh position={[0, -0.55, 0]}><cylinderGeometry args={[0.28, 0.32, 1.2, 18]} /><meshStandardMaterial color="#b8cbe2" metalness={0.45} roughness={0.3} /></mesh>
      <mesh position={[0.34, -0.75, 0]} rotation={[0, 0, 0.35]}><boxGeometry args={[0.08, 0.5, 0.02]} /><meshStandardMaterial color="#00D9FF" emissive="#003b52" /></mesh>
      <mesh position={[-0.34, -0.75, 0]} rotation={[0, 0, -0.35]}><boxGeometry args={[0.08, 0.5, 0.02]} /><meshStandardMaterial color="#00D9FF" emissive="#003b52" /></mesh>
      <mesh position={[0, -1.22, 0]}><cylinderGeometry args={[0.16, 0.08, 0.22, 12]} /><meshBasicMaterial color={input.current.boost ? '#ffd36d' : '#ff8a2b'} transparent opacity={0.9} /></mesh>
      <pointLight position={[0, -1.4, 0]} intensity={input.current.boost ? 2.4 : 1.1} distance={4} color="#ff9a2f" />
    </group>
  )
}

function WorldObjects({ objects }: { objects: React.MutableRefObject<GameObj[]> }) {
  const refs = useRef<Record<number, THREE.Group | null>>({})
  useFrame((_, dt) => {
    for (const o of objects.current) {
      const g = refs.current[o.id]
      if (!g) continue
      g.position.set(o.x, o.y, o.z)
      g.visible = !o.hit
      g.rotation.x += dt * o.spin
      g.rotation.y += dt * o.spin * 0.7
      if (o.kind === 'milestone') g.rotation.z += dt * 0.5
    }
  })
  return (
    <group>
      {objects.current.map((o) => (
        <group key={o.id} ref={(el) => { refs.current[o.id] = el }}>
          {o.kind === 'asteroid' && <mesh><dodecahedronGeometry args={[o.r, 0]} /><meshStandardMaterial color={o.color} roughness={0.95} /></mesh>}
          {o.kind === 'energy' && <mesh><octahedronGeometry args={[o.r, 0]} /><meshStandardMaterial color={o.color} emissive={o.color} emissiveIntensity={0.9} /></mesh>}
          {o.kind === 'data' && <mesh><icosahedronGeometry args={[o.r, 0]} /><meshStandardMaterial color={o.color} emissive={o.color} emissiveIntensity={0.5} metalness={0.4} /></mesh>}
          {o.kind === 'milestone' && (
            <group>
              <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[o.r, 0.08, 10, 48]} /><meshBasicMaterial color={o.color} transparent opacity={0.9} /></mesh>
              <mesh><sphereGeometry args={[o.r * 0.35, 16, 16]} /><meshStandardMaterial color={o.color} emissive={o.color} emissiveIntensity={0.4} /></mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  )
}

function RocketRig({ rpos, input }: { rpos: React.MutableRefObject<{ x: number; y: number }>; input: React.MutableRefObject<{ x: number; y: number; boost: boolean }> }) {
  const g = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (!g.current) return
    g.current.position.x += (rpos.current.x - g.current.position.x) * Math.min(1, dt * 12)
    g.current.position.y += (rpos.current.y - g.current.position.y) * Math.min(1, dt * 12)
    g.current.rotation.z = -input.current.x * 0.45
    g.current.rotation.x = input.current.y * 0.2
  })
  return <group ref={g}><RocketMesh input={input} /></group>
}

export function RocketFlight() {
  const input = useRef({ x: 0, y: 0, boost: false })
  const keys = useRef<Record<string, boolean>>({})
  const objects = useRef<GameObj[]>([])
  const rpos = useRef({ x: 0, y: 0 })
  const state = useRef({ score: 0, hull: 100, energy: 100, distance: 0, combo: 0, comboT: 0, t: 0, spawn: 0, id: 1, milestone: 0, discoveries: [] as string[], over: false, paused: false, awarded: false, msg: '' })
  const [playing, setPlaying] = useState(false)
  const [hud, setHud] = useState<Hud>({ score: 0, hull: 100, energy: 100, distance: 0, combo: 0, msg: 'Pilot the rocket. Dodge asteroids, collect energy and data, fly through exploration zones.', discoveries: [], over: false, paused: false })

  useEffect(() => {
    const down = (e: KeyboardEvent) => { const k = e.key.toLowerCase(); keys.current[k] = true; if (['arrowup','arrowdown','arrowleft','arrowright',' ','w','a','s','d'].includes(k)) e.preventDefault(); if (k === 'p' && playing) { state.current.paused = !state.current.paused } }
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [playing])

  const spawnObj = useCallback((kind: ObjKind, milestone?: typeof MILESTONES[number]) => {
    const id = state.current.id++
    const x = (Math.random() - 0.5) * 8.5, y = (Math.random() - 0.5) * 4.8
    if (kind === 'asteroid') objects.current.push({ id, kind, x, y, z: -55 - Math.random() * 20, r: 0.35 + Math.random() * 0.55, spin: 0.4 + Math.random(), color: '#8f98a6' })
    if (kind === 'energy') objects.current.push({ id, kind, x, y, z: -55 - Math.random() * 20, r: 0.28, spin: 1.6, color: '#46E58A' })
    if (kind === 'data') objects.current.push({ id, kind, x, y, z: -55 - Math.random() * 20, r: 0.26, spin: 1.2, color: '#00D9FF' })
    if (kind === 'milestone' && milestone) objects.current.push({ id, kind, x: 0, y: 0.3, z: -65, r: 1.5, spin: 0.5, color: milestone.color, label: milestone.label })
  }, [])

  const start = useCallback(() => {
    objects.current = []
    rpos.current = { x: 0, y: 0 }
    state.current = { score: 0, hull: 100, energy: 100, distance: 0, combo: 0, comboT: 0, t: 0, spawn: 0, id: 1, milestone: 0, discoveries: [], over: false, paused: false, awarded: false, msg: 'Go!' }
    input.current = { x: 0, y: 0, boost: false }
    setHud({ score: 0, hull: 100, energy: 100, distance: 0, combo: 0, msg: 'Go! Dodge asteroids, collect energy/data, fly through exploration zones.', discoveries: [], over: false, paused: false })
    setPlaying(true)
  }, [])

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    let hudAcc = 0
    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now
      const s = state.current
      if (!s.over && !s.paused) {
        const k = keys.current
        input.current.x = (k['arrowright'] || k['d'] ? 1 : 0) - (k['arrowleft'] || k['a'] ? 1 : 0)
        input.current.y = (k['arrowup'] || k['w'] ? 1 : 0) - (k['arrowdown'] || k['s'] ? 1 : 0)
        input.current.boost = !!(k['shift'] || k[' ']) && s.energy > 5
        const boost = input.current.boost ? 1.45 : 1
        rpos.current.x = THREE.MathUtils.clamp(rpos.current.x + input.current.x * dt * 7.8, -4.8, 4.8)
        rpos.current.y = THREE.MathUtils.clamp(rpos.current.y + input.current.y * dt * 6.5, -2.8, 2.8)
        if (input.current.boost) s.energy = Math.max(0, s.energy - dt * 14); else s.energy = Math.min(100, s.energy + dt * 4.5)
        s.t += dt; s.spawn += dt; s.distance += dt * (18 + Math.min(24, s.t * 0.5)) * boost
        s.comboT = Math.max(0, s.comboT - dt); if (s.comboT <= 0) s.combo = 0
        const diff = Math.min(1.9, 1 + s.t / 40)
        if (s.spawn > 0.52 / diff) { s.spawn = 0; const roll = Math.random(); if (roll < 0.48) spawnObj('asteroid'); else if (roll < 0.73) spawnObj('energy'); else spawnObj('data') }
        const mAt = 380 + s.milestone * 480
        if (s.distance > mAt && !objects.current.some(o => o.kind === 'milestone' && !o.hit)) spawnObj('milestone', MILESTONES[s.milestone % MILESTONES.length])
        for (const o of objects.current) {
          if (o.hit) { o.z += dt * 10; continue }
          o.z += dt * (22 + Math.min(28, s.t * 0.55)) * (o.kind === 'asteroid' ? 1 : 0.95) * (input.current.boost ? 1.15 : 1)
          const dx = o.x - rpos.current.x, dy = o.y - rpos.current.y
          if (Math.abs(o.z) < (o.r + 0.7) && dx * dx + dy * dy < (o.r + 0.45) * (o.r + 0.45)) {
            o.hit = true
            if (o.kind === 'asteroid') { s.hull = Math.max(0, s.hull - 18); s.combo = 0; s.comboT = 0; s.msg = 'Asteroid hit! Hull damaged.' }
            if (o.kind === 'energy') { s.energy = Math.min(100, s.energy + 22); s.score += 40 + s.combo * 8; s.combo += 1; s.comboT = 2.2; s.msg = 'Energy collected!' }
            if (o.kind === 'data') { s.score += 65 + s.combo * 10; s.combo += 1; s.comboT = 2.4; s.msg = 'Data core collected!' }
            if (o.kind === 'milestone') { s.score += 250; s.hull = Math.min(100, s.hull + 10); s.energy = Math.min(100, s.energy + 20); s.discoveries = [o.label || 'Discovery', ...s.discoveries].filter((v,i,a)=>a.indexOf(v)===i).slice(0,6); s.milestone += 1; s.msg = `Explored: ${o.label}` }
          }
        }
        objects.current = objects.current.filter(o => o.z < 14 && !(o.hit && o.z > 10))
        if (s.hull <= 0 && !s.awarded) {
          s.over = true; s.awarded = true; s.msg = `Mission over! Score ${Math.floor(s.score)}.`
          const gs = loadState()
          const gain = Math.floor(s.score / 12) + s.discoveries.length * 12
          saveState({ ...gs, profile: { ...gs.profile, xp: gs.profile.xp + Math.floor(gain / 2), discoveryPoints: gs.profile.discoveryPoints + gain } })
        }
      }
      hudAcc += dt
      if (hudAcc > 0.1) {
        hudAcc = 0
        setHud({ score: Math.floor(s.score), hull: s.hull, energy: s.energy, distance: Math.floor(s.distance), combo: s.combo, msg: s.over ? s.msg : s.paused ? 'Paused (press P)' : input.current.boost ? 'BOOST! Watch your energy.' : s.msg || 'Dodge asteroids. Collect energy and data.', discoveries: [...s.discoveries], over: s.over, paused: s.paused })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, spawnObj])

  const hold = (k: string, v: boolean) => { keys.current[k] = v }
  const pause = () => { state.current.paused = !state.current.paused; setHud(h => ({ ...h, paused: state.current.paused })) }

  return (
    <PageShell className="min-h-[100dvh] lg:h-[100dvh] lg:overflow-hidden">
      <div className="grid h-full gap-3 p-3 sm:p-4 lg:grid-cols-[1fr_310px]">
        <Panel className="relative min-h-[58vh] overflow-hidden p-0">
          <div className="absolute inset-0">
            <Canvas dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
              <Suspense fallback={null}>
                <color attach="background" args={['#020611']} />
                <fog attach="fog" args={['#020611', 10, 70]} />
                <PerspectiveCamera makeDefault position={[0, 1.7, 6.8]} fov={60} />
                <ambientLight intensity={0.42} />
                <directionalLight position={[6, 8, 4]} intensity={1.5} color="#eaf4ff" />
                <Stars radius={90} depth={50} count={2200} factor={3} saturation={0} fade speed={playing && !hud.paused && !hud.over ? 1.2 : 0.2} />
                <RocketRig rpos={rpos} input={input} />
                <WorldObjects objects={objects} />
              </Suspense>
            </Canvas>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,23,0.2),transparent_30%,rgba(3,8,23,0.45))]" />
          <div className="absolute left-3 top-3 right-3 flex items-center justify-between gap-2 pointer-events-auto">
            <Panel className="px-3 py-2"><span className="hud-label text-cyan">Play Game</span><span className="ml-2 font-semibold">Rocket Run</span></Panel>
            {playing && !hud.over && <Button onClick={pause}><Pause size={15}/> {hud.paused ? 'Resume' : 'Pause'}</Button>}
          </div>
          {!playing && (
            <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-auto bg-bg/35">
              <Panel className="max-w-lg p-6 text-center">
                <Rocket className="mx-auto text-cyan" size={34} />
                <h1 className="mt-3 font-[Space_Grotesk] text-3xl font-semibold">Rocket Run: Space Explorer</h1>
                <p className="mt-3 text-sm leading-7 text-text-muted">Real-time space game. Steer your rocket, dodge asteroids, collect energy/data cores, and fly through exploration rings for big bonuses.</p>
                <div className="mt-4 text-sm text-text-muted">Controls: <span className="text-text">WASD / Arrows</span> move, <span className="text-text">Shift/Space</span> boost, <span className="text-text">P</span> pause.</div>
                <Button variant="primary" className="mt-5 px-6 py-3" onClick={start}><Play size={16}/> Launch Game</Button>
              </Panel>
            </div>
          )}
          {hud.over && (
            <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-auto bg-bg/45">
              <Panel className="max-w-md p-6 text-center">
                <h2 className="font-[Space_Grotesk] text-3xl font-semibold">Mission Over</h2>
                <p className="mt-2 text-text-muted">Score <span className="font-[Orbitron] text-cyan">{hud.score}</span> · Distance {hud.distance} · Zones {hud.discoveries.length}</p>
                <div className="mt-5 flex justify-center gap-3"><Button variant="primary" onClick={start}><RotateCcw size={16}/> Play Again</Button><Link to="/mission-control"><Button>Control</Button></Link></div>
              </Panel>
            </div>
          )}
          <div className="absolute bottom-3 left-3 right-3 grid grid-cols-3 gap-2 pointer-events-auto md:hidden">
            <div /><button type="button" className="rounded-xl border border-cyan/25 bg-cyan/10 p-3 text-cyan" onPointerDown={()=>hold('arrowup',true)} onPointerUp={()=>hold('arrowup',false)} onPointerLeave={()=>hold('arrowup',false)}><ArrowUp className="mx-auto"/></button><button type="button" className="rounded-xl border border-amber/25 bg-amber/10 p-3 text-amber" onPointerDown={()=>hold(' ',true)} onPointerUp={()=>hold(' ',false)} onPointerLeave={()=>hold(' ',false)}><Zap className="mx-auto"/></button>
            <button type="button" className="rounded-xl border border-white/10 bg-white/5 p-3" onPointerDown={()=>hold('arrowleft',true)} onPointerUp={()=>hold('arrowleft',false)} onPointerLeave={()=>hold('arrowleft',false)}><ArrowLeft className="mx-auto"/></button>
            <button type="button" className="rounded-xl border border-white/10 bg-white/5 p-3" onPointerDown={()=>hold('arrowdown',true)} onPointerUp={()=>hold('arrowdown',false)} onPointerLeave={()=>hold('arrowdown',false)}><ArrowDown className="mx-auto"/></button>
            <button type="button" className="rounded-xl border border-white/10 bg-white/5 p-3" onPointerDown={()=>hold('arrowright',true)} onPointerUp={()=>hold('arrowright',false)} onPointerLeave={()=>hold('arrowright',false)}><ArrowRight className="mx-auto"/></button>
          </div>
        </Panel>
        <div className="space-y-3 overflow-auto">
          <Panel className="p-4">
            <div className="hud-label">Live HUD</div>
            <div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-xl border border-white/8 bg-white/3 p-3"><div className="hud-label">Score</div><div className="font-[Orbitron] text-xl text-cyan">{hud.score}</div></div><div className="rounded-xl border border-white/8 bg-white/3 p-3"><div className="hud-label">Combo</div><div className="font-[Orbitron] text-xl text-amber">x{hud.combo}</div></div></div>
            <div className="mt-3 space-y-2"><div><div className="mb-1 flex justify-between text-xs text-text-muted"><span className="flex items-center gap-1"><Heart size={13}/> Hull</span><span>{Math.round(hud.hull)}%</span></div><ProgressBar value={hud.hull} tone={hud.hull>35?'green':'amber'} /></div><div><div className="mb-1 flex justify-between text-xs text-text-muted"><span className="flex items-center gap-1"><Zap size={13}/> Energy</span><span>{Math.round(hud.energy)}%</span></div><ProgressBar value={hud.energy} tone="cyan" /></div></div>
            <div className="mt-3 rounded-xl border border-cyan/15 bg-cyan/5 p-3 text-sm text-text-muted">{hud.msg}</div>
          </Panel>
          <Panel className="p-4"><div className="hud-label">Exploration Zones</div><div className="mt-2 space-y-1">{hud.discoveries.length ? hud.discoveries.map(d=><div key={d} className="rounded-lg border border-success/20 bg-success/8 p-2 text-sm"><Sparkles size={13} className="inline text-success mr-1"/>{d}</div>) : <div className="text-sm text-text-muted">Fly through glowing rings to explore zones.</div>}</div></Panel>
          <Panel className="p-4"><div className="hud-label">Legend</div><div className="mt-2 space-y-1 text-sm text-text-muted"><div>Gray rocks: asteroids (damage hull)</div><div className="text-success">Green crystals: energy + score</div><div className="text-cyan">Cyan cores: data/score/combo</div><div className="text-violet">Rings: exploration zones (big bonus)</div></div><div className="mt-3 text-xs text-text-muted">Distance: {hud.distance}</div></Panel>
        </div>
      </div>
    </PageShell>
  )
}
