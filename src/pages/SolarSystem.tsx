import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { PageShell } from '../components/layout/PageShell'
import { Panel, HudTag } from '../components/ui/Panel'
import { Starfield } from '../components/space/Starfield'
import { solarBodies, type BodyInfo } from '../data/catalog'
import { loadState, unlockAchievement } from '../store/gameStore'

function BodyMesh({ body, selected, onSelect }: { body: BodyInfo; selected: boolean; onSelect: (b: BodyInfo) => void }) {
  const ref = useRef<THREE.Group>(null)
  const angle = useRef(Math.random() * Math.PI * 2)
  useFrame((_, delta) => {
    if (!ref.current) return
    angle.current += delta * body.speed * 0.12
    if (body.orbit > 0) {
      ref.current.position.x = Math.cos(angle.current) * body.orbit
      ref.current.position.z = Math.sin(angle.current) * body.orbit
    }
    ref.current.rotation.y += delta * 0.25
  })
  if (body.id === 'moon') return null
  return (
    <group ref={ref} position={body.orbit ? [body.orbit, 0, 0] : [0, 0, 0]} onClick={(e) => { e.stopPropagation(); onSelect(body) }}>
      <mesh>
        <sphereGeometry args={[body.radius, 32, 32]} />
        <meshStandardMaterial color={body.color} emissive={selected ? body.color : body.id === 'sun' ? '#aa5500' : '#000000'} emissiveIntensity={selected ? 0.35 : body.id === 'sun' ? 0.8 : 0} />
      </mesh>
      {body.id === 'saturn' && (
        <mesh rotation={[Math.PI / 2.4, 0, 0]}>
          <ringGeometry args={[body.radius * 1.4, body.radius * 2.1, 64]} />
          <meshBasicMaterial color="#d9c88a" transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>
      )}
      {body.id === 'earth' && <Moon onSelect={onSelect} selected={selected} />}
    </group>
  )
}

function Moon({ onSelect, selected }: { onSelect: (b: BodyInfo) => void; selected: boolean }) {
  const ref = useRef<THREE.Group>(null)
  const angle = useRef(0)
  const body = solarBodies.find((b) => b.id === 'moon')!
  useFrame((_, delta) => {
    angle.current += delta * 1.1
    if (ref.current) {
      ref.current.position.x = Math.cos(angle.current) * body.orbit
      ref.current.position.z = Math.sin(angle.current) * body.orbit
    }
  })
  return (
    <group ref={ref}>
      <mesh onClick={(e) => { e.stopPropagation(); onSelect(body) }}>
        <sphereGeometry args={[body.radius, 24, 24]} />
        <meshStandardMaterial color={body.color} emissive={selected ? '#444' : '#000'} emissiveIntensity={0.2} />
      </mesh>
    </group>
  )
}

export function SolarSystem() {
  const [selected, setSelected] = useState<BodyInfo>(solarBodies.find((b) => b.id === 'earth') || solarBodies[0])
  const [visited, setVisited] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('orbit-visited-bodies') || '[]') } catch { return [] }
  })
  const bodies = useMemo(() => solarBodies.filter((b) => b.id !== 'moon'), [])

  const select = (b: BodyInfo) => {
    setSelected(b)
    setVisited((prev) => {
      if (prev.includes(b.id)) return prev
      const next = [...prev, b.id]
      localStorage.setItem('orbit-visited-bodies', JSON.stringify(next))
      if (solarBodies.every((sb) => next.includes(sb.id))) {
        unlockAchievement(loadState(), 'solar-explorer')
      }
      return next
    })
  }

  return (
    <PageShell backTo="/mission-control" backLabel="Mission Control" className="h-[100dvh] overflow-hidden">
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 10, 18], fov: 48 }} dpr={[1, 1.5]}>
          <Suspense fallback={null}>
            <color attach="background" args={['#020611']} />
            <ambientLight intensity={0.22} />
            <pointLight position={[0, 0, 0]} intensity={2.8} color="#ffd27d" />
            <Starfield count={1400} />
            {bodies.map((b) => b.orbit > 0 && (
              <mesh key={`o-${b.id}`} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[b.orbit - 0.01, b.orbit + 0.01, 128]} />
                <meshBasicMaterial color="#00d9ff" transparent opacity={0.12} side={THREE.DoubleSide} />
              </mesh>
            ))}
            {bodies.map((b) => <BodyMesh key={b.id} body={b} selected={selected.id === b.id} onSelect={select} />)}
            <OrbitControls enablePan minDistance={4} maxDistance={40} />
          </Suspense>
        </Canvas>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-bg/75 via-transparent to-bg/70" />
      <div className="relative z-10 flex h-full flex-col p-3 sm:p-4">
        <div className="pointer-events-auto"><Panel className="inline-flex items-center gap-3 px-4 py-2"><span className="hud-label text-cyan">Solar System Explorer</span><HudTag tone="green">{visited.length}/{solarBodies.length} visited</HudTag></Panel></div>
        <div className="mt-3 flex min-h-0 flex-1 items-end justify-between gap-3">
          <Panel className="pointer-events-auto max-h-full w-full max-w-sm overflow-auto p-4">
            <div className="hud-label">Selected Body</div>
            <h2 className="mt-2 font-[Space_Grotesk] text-2xl font-semibold" style={{ color: selected.color }}>{selected.name}</h2>
            <div className="mt-1 text-sm text-text-muted">{selected.type}</div>
            <p className="mt-3 text-sm leading-7 text-text-muted">{selected.science}</p>
            <div className="mt-3 space-y-2">{selected.facts.map((f) => <div key={f} className="rounded-lg border border-white/8 bg-white/3 p-2 text-sm text-text-muted">• {f}</div>)}</div>
          </Panel>
          <Panel className="pointer-events-auto hidden max-h-full w-full max-w-[220px] overflow-auto p-3 lg:block">
            <div className="hud-label mb-2">Bodies</div>
            <div className="space-y-1">{solarBodies.map((b) => <button key={b.id} type="button" onClick={() => select(b)} className={`w-full rounded-lg px-2 py-2 text-left text-sm ${selected.id === b.id ? 'bg-cyan/10 text-text' : 'text-text-muted hover:bg-white/5'}`}>{b.name}</button>)}</div>
          </Panel>
        </div>
      </div>
    </PageShell>
  )
}
