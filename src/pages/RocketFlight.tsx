import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Stars, Text } from '@react-three/drei'
import * as THREE from 'three'
import { Link } from 'react-router-dom'
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Gauge, MapPin, Radio,
  Rocket, Scan, Shield, Users, Zap, ChevronRight, RotateCcw, Eye, Monitor,
} from 'lucide-react'
import { PageShell } from '../components/layout/PageShell'
import { Panel, HudTag } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/Progress'
import { loadState, saveState } from '../store/gameStore'
import { useSettings, prefersReducedMotion } from '../lib/settings'

type Phase = 'select' | 'briefing' | 'transit' | 'landing' | 'landed' | 'debrief'
type ViewMode = 'external' | 'cockpit'

type Objective = { id: string; label: string; hint: string; done: boolean; type: 'scan' | 'sample' | 'image' | 'deploy' }
type Destination = {
  id: string; name: string; kind: string; color: string; atmosphere: string; gravity: string
  difficulty: number; landable: boolean; sky: string; ground: string; facts: string[]
  objectives: Omit<Objective, 'done'>[]
}

const DESTINATIONS: Destination[] = [
  {
    id: 'moon', name: 'Moon', kind: 'Lunar surface', color: '#d8dde6', atmosphere: '#0b1020', gravity: '1.62 m/s²', difficulty: 1, landable: true,
    sky: '#050814', ground: '#8f96a3', facts: ['Low gravity affects landing control.', 'Regolith and lighting conditions are key exploration factors.'],
    objectives: [
      { id: 'm1', label: 'Scan landing zone terrain', hint: 'Check slope and boulder hazards near the site.', type: 'scan' },
      { id: 'm2', label: 'Collect regolith sample', hint: 'Gather surface material for composition clues.', type: 'sample' },
      { id: 'm3', label: 'Capture horizon imagery', hint: 'Document lighting and surface features.', type: 'image' },
      { id: 'm4', label: 'Deploy science beacon', hint: 'Place a sensor for local measurements.', type: 'deploy' },
    ],
  },
  {
    id: 'mars', name: 'Mars', kind: 'Martian surface', color: '#d96b43', atmosphere: '#3a1a12', gravity: '3.71 m/s²', difficulty: 2, landable: true,
    sky: '#8a4a35', ground: '#b45739', facts: ['Thin atmosphere changes descent behavior.', 'Ancient water evidence makes geology a priority.'],
    objectives: [
      { id: 'r1', label: 'Scan atmospheric dust', hint: 'Measure dust and visibility conditions.', type: 'scan' },
      { id: 'r2', label: 'Collect rock sample', hint: 'Target layered or mineral-rich material.', type: 'sample' },
      { id: 'r3', label: 'Image geological outcrop', hint: 'Record structures that may hint at past water.', type: 'image' },
      { id: 'r4', label: 'Deploy weather sensor', hint: 'Monitor local surface conditions.', type: 'deploy' },
    ],
  },
  {
    id: 'asteroid', name: 'Asteroid Survey Site', kind: 'Near-surface ops', color: '#9ea7b3', atmosphere: '#04070f', gravity: 'Microgravity', difficulty: 3, landable: true,
    sky: '#02040a', ground: '#6f7884', facts: ['Very weak gravity requires careful control.', 'Composition can inform Solar System origins and resources.'],
    objectives: [
      { id: 'a1', label: 'Scan rotation and stability', hint: 'Confirm safe approach conditions.', type: 'scan' },
      { id: 'a2', label: 'Collect surface material', hint: 'Sample primitive material carefully.', type: 'sample' },
      { id: 'a3', label: 'Capture shape imagery', hint: 'Map visible structure and texture.', type: 'image' },
      { id: 'a4', label: 'Deploy tracking marker', hint: 'Mark the sampled location.', type: 'deploy' },
    ],
  },
  {
    id: 'jupiter-orbit', name: 'Jupiter Orbit Research', kind: 'Orbital exploration', color: '#e0be8a', atmosphere: '#2a2014', gravity: '24.79 m/s² (planet)', difficulty: 2, landable: false,
    sky: '#120d08', ground: '#c79f66', facts: ['No solid landing; mission is orbital observation.', 'Magnetosphere and cloud systems are key targets.'],
    objectives: [
      { id: 'j1', label: 'Scan radiation environment', hint: 'Assess instrument safety conditions.', type: 'scan' },
      { id: 'j2', label: 'Collect spectral data', hint: 'Analyze atmospheric composition signals.', type: 'sample' },
      { id: 'j3', label: 'Image cloud bands', hint: 'Capture large-scale atmospheric patterns.', type: 'image' },
      { id: 'j4', label: 'Deploy relay packet', hint: 'Transmit findings to mission control.', type: 'deploy' },
    ],
  },
]

type Crew = { id: string; name: string; role: string; status: string; color: string }
const CREW: Crew[] = [
  { id: 'pilot', name: 'Cmdr. Reyes', role: 'Pilot / Flight', status: 'Ready', color: '#00D9FF' },
  { id: 'eng', name: 'Eng. Chen', role: 'Engineer / Systems', status: 'Nominal', color: '#46E58A' },
  { id: 'sci', name: 'Dr. Imani', role: 'Science Officer', status: 'Standing by', color: '#FFB020' },
]

function PlanetMesh({ dest, detail = 40 }: { dest: Destination; detail?: number }) {
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: dest.color, roughness: 0.92, metalness: 0.02, emissive: dest.color, emissiveIntensity: 0.04 })
    m.onBeforeCompile = (s) => {
      s.vertexShader = s.vertexShader.replace('#include <common>', `#include <common>\nvarying vec3 vP;`)
      s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\nvP = normalize(position);`)
      s.fragmentShader = s.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec3 vP;
        float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);} 
        float n(vec2 p){vec2 i=floor(p),f=fract(p);float a=h(i),b=h(i+vec2(1,0)),c=h(i+vec2(0,1)),d=h(i+vec2(1,1));vec2 u=f*f*(3.-2.*f);return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;}
        float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}`)
      s.fragmentShader = s.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', `
        vec2 uv = vec2(atan(vP.z,vP.x)/6.2831853+.5, asin(clamp(vP.y,-1.,1.))/3.14159265+.5);
        float t = fbm(uv*6.0);
        float c2 = fbm(uv*14.0);
        vec3 base = diffuse;
        vec3 dark = base * 0.62;
        vec3 light = base * 1.18;
        vec3 col = mix(dark, light, smoothstep(0.35,0.72,t + c2*0.18));
        col += pow(max(dot(normalize(vNormal), normalize(vec3(.4,.7,.5))),0.), 3.) * 0.05;
        vec4 diffuseColor = vec4(col, opacity);`)
    }
    return m
  }, [dest.color])
  return (
    <group>
      <mesh>
        <sphereGeometry args={[2.2, detail, detail]} />
        <primitive object={mat} attach="material" />
      </mesh>
      <mesh scale={1.045}>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshBasicMaterial color={dest.color} transparent opacity={0.12} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}

function RocketExterior({ thrust = 0.4, scale = 1 }: { thrust?: number; scale?: number }) {
  return (
    <group scale={scale} rotation={[Math.PI / 2, 0, 0]}>
      <mesh position={[0, 0.85, 0]}><coneGeometry args={[0.24, 0.75, 20]} /><meshStandardMaterial color="#edf5ff" metalness={0.65} roughness={0.18} /></mesh>
      <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.24, 0.28, 1.65, 24]} /><meshStandardMaterial color="#c3d3e8" metalness={0.5} roughness={0.28} /></mesh>
      <mesh position={[0, -0.62, 0]}><cylinderGeometry args={[0.2, 0.2, 0.5, 16]} /><meshStandardMaterial color="#8ea6c4" metalness={0.35} roughness={0.4} /></mesh>
      {[0,1,2,3].map(i => (
        <mesh key={i} position={[Math.cos(i*Math.PI/2)*0.26,-0.55,Math.sin(i*Math.PI/2)*0.26]} rotation={[i%2?0.18:-0.18, (i*Math.PI)/2, 0]}>
          <boxGeometry args={[0.02, 0.42, 0.2]} /><meshStandardMaterial color="#00D9FF" emissive="#003545" metalness={0.4} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, 0.28, 0.22]}><sphereGeometry args={[0.08, 12, 12]} /><meshStandardMaterial color="#7fdcff" emissive="#0b3a55" emissiveIntensity={0.8} metalness={0.1} roughness={0.05} /></mesh>
      <mesh position={[0, -1.02, 0]}><coneGeometry args={[0.11 + thrust*0.04, 0.35 + thrust*0.22, 12]} /><meshBasicMaterial color={thrust>0.7?'#ffe08a':'#ff8a2b'} transparent opacity={0.88} /></mesh>
      <pointLight position={[0,-1.1,0]} intensity={thrust*2.2} distance={4} color="#ff9a2f" />
    </group>
  )
}

function CockpitInterior({ dest, speed, fuel, alt, phase }: { dest: Destination; speed: number; fuel: number; alt: number; phase: Phase }) {
  return (
    <group>
      {/* canopy frame */}
      <mesh position={[0, 0.35, -1.35]}><boxGeometry args={[2.2, 0.03, 1.6]} /><meshStandardMaterial color="#1a2a44" metalness={0.6} roughness={0.3} /></mesh>
      <mesh position={[-0.85, 0.15, -1.35]} rotation={[0,0,0.18]}><boxGeometry args={[0.04, 0.7, 1.5]} /><meshStandardMaterial color="#223555" metalness={0.5} roughness={0.35} /></mesh>
      <mesh position={[0.85, 0.15, -1.35]} rotation={[0,0,-0.18]}><boxGeometry args={[0.04, 0.7, 1.5]} /><meshStandardMaterial color="#223555" metalness={0.5} roughness={0.35} /></mesh>
      {/* dashboard */}
      <mesh position={[0, -0.22, -0.95]} rotation={[-0.45, 0, 0]}><boxGeometry args={[1.85, 0.06, 0.7]} /><meshStandardMaterial color="#0b1628" metalness={0.4} roughness={0.45} /></mesh>
      <mesh position={[-0.45, -0.2, -0.78]} rotation={[-0.45,0,0]}><planeGeometry args={[0.55, 0.28]} /><meshBasicMaterial color="#001a2a" /></mesh>
      <mesh position={[0.15, -0.2, -0.78]} rotation={[-0.45,0,0]}><planeGeometry args={[0.55, 0.28]} /><meshBasicMaterial color="#001a2a" /></mesh>
      <mesh position={[0.68, -0.2, -0.78]} rotation={[-0.45,0,0]}><planeGeometry args={[0.38, 0.28]} /><meshBasicMaterial color="#001a2a" /></mesh>
      <Text position={[-0.45,-0.14,-0.74]} rotation={[-0.45,0,0]} fontSize={0.055} color="#00D9FF" anchorX="center" anchorY="middle">SPD {Math.round(speed)}</Text>
      <Text position={[0.15,-0.14,-0.74]} rotation={[-0.45,0,0]} fontSize={0.055} color="#46E58A" anchorX="center" anchorY="middle">ALT {Math.round(alt)}</Text>
      <Text position={[0.68,-0.14,-0.74]} rotation={[-0.45,0,0]} fontSize={0.048} color="#FFB020" anchorX="center" anchorY="middle">FUEL {Math.round(fuel)}%</Text>
      <Text position={[0,-0.26,-0.74]} rotation={[-0.45,0,0]} fontSize={0.04} color="#9fb3c8" anchorX="center" anchorY="middle">{phase.toUpperCase()} • {dest.name}</Text>
      {/* side panels */}
      <mesh position={[-1.02, -0.05, -0.9]} rotation={[0,0.35,0]}><boxGeometry args={[0.3, 0.55, 0.8]} /><meshStandardMaterial color="#0c1830" metalness={0.3} roughness={0.5} /></mesh>
      <mesh position={[1.02, -0.05, -0.9]} rotation={[0,-0.35,0]}><boxGeometry args={[0.3, 0.55, 0.8]} /><meshStandardMaterial color="#0c1830" metalness={0.3} roughness={0.5} /></mesh>
      <pointLight position={[0,0.1,-0.8]} intensity={0.5} distance={3} color="#00D9FF" />
    </group>
  )
}

function TransitScene({ dest, input, view, phase, altRef, onArrive }: {
  dest: Destination; input: React.MutableRefObject<{ x: number; y: number; throttle: number }>; view: ViewMode; phase: Phase; altRef: React.MutableRefObject<number>; onArrive: () => void
}) {
  const ship = useRef<THREE.Group>(null)
  const planetRef = useRef<THREE.Group>(null)
  const vel = useRef({ x: 0, y: 0 })
  const arrived = useRef(false)
  useFrame((_, dt) => {
    if (phase !== 'transit') return
    const d = Math.min(dt, 0.033)
    if (ship.current) {
      vel.current.x += input.current.x * d * 2.2
      vel.current.y += input.current.y * d * 1.8
      vel.current.x *= 0.985; vel.current.y *= 0.985
      ship.current.position.x = THREE.MathUtils.clamp(ship.current.position.x + vel.current.x * d * 4, -3.5, 3.5)
      ship.current.position.y = THREE.MathUtils.clamp(ship.current.position.y + vel.current.y * d * 3, -2.2, 2.2)
      ship.current.rotation.z = -vel.current.x * 0.12
      ship.current.rotation.x = vel.current.y * 0.08
    }
    altRef.current = Math.max(0, altRef.current - input.current.throttle * d * 16)
    if (planetRef.current) planetRef.current.rotation.y += d * 0.04
    if (!arrived.current && altRef.current <= 60) { arrived.current = true; onArrive() }
  })
  const p = 1 - Math.min(1, altRef.current / 3000)
  return (
    <>
      <color attach="background" args={['#020611']} />
      <fog attach="fog" args={['#020611', 12, 90]} />
      <ambientLight intensity={0.32} />
      <directionalLight position={[8,6,4]} intensity={1.6} color="#f3f8ff" />
      <Stars radius={100} depth={60} count={2800} factor={3} saturation={0} fade speed={0.5} />
      <group ref={planetRef} position={[0, 0, -35 + p * 22]} scale={1 + p * 0.6}>
        <PlanetMesh dest={dest} />
      </group>
      {view === 'external' ? (
        <>
          <PerspectiveCamera makeDefault position={[0, 2.2, 7]} fov={58} />
          <group ref={ship}><RocketExterior thrust={0.25 + input.current.throttle * 0.75} /></group>
        </>
      ) : (
        <>
          <PerspectiveCamera makeDefault position={[0, 0.1, 0]} fov={75} />
          <CockpitInterior dest={dest} speed={Math.round(8000 + input.current.throttle*26000)} fuel={100} alt={Math.round(altRef.current)} phase={phase} />
        </>
      )}
    </>
  )
}

function LandingScene({ dest, landing, onStatus }: { dest: Destination; landing: React.MutableRefObject<{ x: number; y: number; vx: number; vy: number; fuel: number }>; onStatus: (ok: boolean | null) => void }) {
  const padX = 0
  const done = useRef(false)
  const ship = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    const d = Math.min(dt, 0.033)
    const keys = (window as any).__orbitKeys || {}
    const thrust = keys['arrowup'] || keys['w'] || keys['shift'] || keys[' ']
    const left = keys['arrowleft'] || keys['a']
    const right = keys['arrowright'] || keys['d']
    const g = dest.id === 'moon' ? 1.62 : dest.id === 'mars' ? 3.71 : 0.8
    if (!done.current) {
      if (thrust && landing.current.fuel > 0) { landing.current.vy += d * (g + 5.2); landing.current.fuel = Math.max(0, landing.current.fuel - d * 18) }
      landing.current.vy -= d * g
      landing.current.vx += ((right?1:0)-(left?1:0)) * d * 2.4
      landing.current.vx *= 0.992
      landing.current.x = THREE.MathUtils.clamp(landing.current.x + landing.current.vx * d, -6, 6)
      landing.current.y = Math.max(0, landing.current.y + landing.current.vy * d)
      if (landing.current.y <= 0.02) {
        landing.current.y = 0
        const soft = landing.current.vy > -2.2 && Math.abs(landing.current.vx) < 1.4 && Math.abs(landing.current.x - padX) < 1.8
        done.current = true
        landing.current.vy = 0
        onStatus(soft)
      } else if (landing.current.fuel <= 0 && landing.current.y > 0.2) {
        done.current = true
        onStatus(false)
      }
    }
    if (ship.current) { ship.current.position.x = landing.current.x; ship.current.position.y = landing.current.y + 0.9 }
  })
  const thrustOn = typeof window !== 'undefined' && (window as any).__orbitKeys && ((window as any).__orbitKeys['arrowup']||(window as any).__orbitKeys['w']||(window as any).__orbitKeys[' ']||(window as any).__orbitKeys['shift'])
  return (
    <>
      <color attach="background" args={[dest.sky]} />
      <fog attach="fog" args={[dest.sky, 8, 60]} />
      <PerspectiveCamera makeDefault position={[0, 3.2, 10]} fov={60} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 10, 6]} intensity={1.4} color="#f4f7ff" />
      <Stars radius={120} depth={40} count={dest.id === 'moon' ? 2600 : 1200} factor={2.5} saturation={0} fade speed={0} />
      <mesh position={[0,-0.5,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[80,80,40,40]} /><meshStandardMaterial color={dest.ground} roughness={1} metalness={0} /></mesh>
      <mesh position={[padX, 0.01, 0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.1,1.7,48]} /><meshBasicMaterial color="#00D9FF" transparent opacity={0.85} side={THREE.DoubleSide} /></mesh>
      <mesh position={[padX, 0.005, 0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[1.1,48]} /><meshStandardMaterial color="#13233d" emissive="#08203a" /></mesh>
      <Text position={[padX,0.02,1.95]} rotation={[-Math.PI/2,0,0]} fontSize={0.22} color="#00D9FF">LANDING ZONE</Text>
      {[[-3,0.12,-2,0.35], [2.8,0.09,-1.4,0.25], [-4.5,0.15,1.5,0.45], [4.2,0.1,2.2,0.3]].map((r,i)=>(
        <mesh key={i} position={[r[0],r[1],r[2]]}><dodecahedronGeometry args={[r[3],0]} /><meshStandardMaterial color={dest.ground} roughness={1} /></mesh>
      ))}
      <group ref={ship} position={[landing.current.x, landing.current.y + 0.9, 0]}>
        <RocketExterior thrust={thrustOn ? 0.8 : 0.05} scale={0.9} />
      </group>
    </>
  )
}

function ExploreScene({ dest, objectives, onSelect }: { dest: Destination; objectives: Objective[]; onSelect: (id: string) => void }) {
  const spots = useMemo(() => objectives.map((o, i) => ({ ...o, pos: [ (i%2?1:-1)*(1.2+i*0.8), 0.18, -1.5 + i*1.1 ] as [number,number,number] })), [objectives])
  return (
    <>
      <color attach="background" args={[dest.sky]} />
      <fog attach="fog" args={[dest.sky, 6, 45]} />
      <PerspectiveCamera makeDefault position={[0, 2.8, 7.5]} fov={58} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[6,10,5]} intensity={1.3} color="#f6f8ff" />
      <Stars radius={120} depth={40} count={dest.id === 'moon' ? 2400 : 1000} factor={2.5} saturation={0} fade speed={0} />
      <mesh position={[0,-0.5,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[60,60,30,30]} /><meshStandardMaterial color={dest.ground} roughness={1} /></mesh>
      {/* landed rocket */}
      <group position={[-2.2, 0.8, -2.8]}><RocketExterior thrust={0} scale={0.85} /></group>
      {/* crew markers */}
      {CREW.map((c,i)=>(<group key={c.id} position={[-1.2+i*0.7,0.22, -1.2]}><mesh><capsuleGeometry args={[0.09,0.22,4,8]} /><meshStandardMaterial color={c.color} emissive={c.color} emissiveIntensity={0.2} /></mesh></group>))}
      {spots.map(s => (
        <group key={s.id} position={s.pos} onClick={(e)=>{ e.stopPropagation(); if(!s.done) onSelect(s.id) }}>
          <mesh><cylinderGeometry args={[0.38,0.42,0.08,24]} /><meshStandardMaterial color={s.done ? '#46E58A' : '#00D9FF'} emissive={s.done ? '#1f6a3f' : '#003b52'} emissiveIntensity={s.done?0.3:0.8} /></mesh>
          <mesh position={[0,0.55,0]}><octahedronGeometry args={[0.16,0]} /><meshStandardMaterial color={s.done ? '#46E58A' : '#FFB020'} emissive={s.done ? '#1f6a3f' : '#5a3a00'} emissiveIntensity={0.7} /></mesh>
          <Text position={[0,0.95,0]} fontSize={0.14} color={s.done?'#46E58A':'#ffffff'} anchorX="center" anchorY="middle" outlineWidth={0.01} outlineColor="#020611">{s.done?'DONE':s.type.toUpperCase()}</Text>
        </group>
      ))}
      <Text position={[0,0.02,2.2]} rotation={[-Math.PI/2,0,0]} fontSize={0.2} color="#eaf4ff" anchorX="center">Tap/click objective markers to explore</Text>
    </>
  )
}

export function RocketFlight() {
  const { settings } = useSettings()
  const reduce = prefersReducedMotion(settings)
  const [phase, setPhase] = useState<Phase>('select')
  const [dest, setDest] = useState<Destination>(DESTINATIONS[0])
  const [view, setView] = useState<ViewMode>('external')
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [crewMsg, setCrewMsg] = useState(`${CREW[0].name}: Select a destination. The team is ready.`)
  const [hud, setHud] = useState({ speed: 0, fuel: 100, alt: 3000, lFuel: 100, lVy: 0 })
  const [landingStatus, setLandingStatus] = useState<'flying'|'ok'|'fail'>('flying')
  const [transitMsg, setTransitMsg] = useState('')
  const input = useRef({ x: 0, y: 0, throttle: 0.2 })
  const keys = useRef<Record<string,boolean>>({})
  const landing = useRef({ x: 0, y: 18, vx: 0, vy: 0, fuel: 100 })
  const altRef = useRef(3000)
  const fuelRef = useRef(100)
  const arrivedRef = useRef(false)
  const awardedRef = useRef(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => { const k=e.key.toLowerCase(); keys.current[k]=true; (window as any).__orbitKeys=keys.current; if(['arrowup','arrowdown','arrowleft','arrowright',' ','w','a','s','d','shift'].includes(k)) e.preventDefault() }
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()]=false; (window as any).__orbitKeys=keys.current }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); (window as any).__orbitKeys={} }
  }, [])

  useEffect(() => {
    if (phase !== 'transit' && phase !== 'landing') return
    const id = window.setInterval(() => {
      const k = keys.current
      input.current.x = (k['arrowright']||k['d']?1:0)-(k['arrowleft']||k['a']?1:0)
      input.current.y = (k['arrowup']||k['w']?1:0)-(k['arrowdown']||k['s']?1:0)
      const t = k['shift']||k[' '] ? 1 : k['arrowdown']||k['s'] ? 0.08 : 0.35
      input.current.throttle = t
      if (phase === 'transit') fuelRef.current = Math.max(0, fuelRef.current - (t > 0.7 ? 0.07 : 0.015))
      setHud({ speed: Math.round(8000 + t * 26000), fuel: fuelRef.current, alt: altRef.current, lFuel: landing.current.fuel, lVy: landing.current.vy })
    }, 100)
    return () => window.clearInterval(id)
  }, [phase])

  const onArrive = useCallback(() => {
    if (arrivedRef.current) return
    arrivedRef.current = true
    setTransitMsg(dest.landable ? `${CREW[0].name}: Approach complete. Begin landing.` : `${CREW[0].name}: Orbit achieved. Begin exploration.`)
    setTimeout(() => {
      if (dest.landable) { landing.current = { x: (Math.random()-0.5)*2, y: 18, vx: 0, vy: 0, fuel: 100 }; setLandingStatus('flying'); setPhase('landing') }
      else { setObjectives(dest.objectives.map(o=>({ ...o, done: false }))); setPhase('landed'); setCrewMsg(`${CREW[2].name}: Orbital station-keeping stable. Complete objectives.`) }
    }, reduce ? 200 : 900)
  }, [dest, reduce])

  const begin = (d: Destination) => {
    awardedRef.current = false; arrivedRef.current = false
    altRef.current = 3000; fuelRef.current = 100
    setDest(d); setObjectives(d.objectives.map(o=>({ ...o, done:false }))); setHud({ speed:0, fuel:100, alt:3000, lFuel:100, lVy:0 }); setView('external'); setPhase('briefing'); setTransitMsg('')
    setCrewMsg(`${CREW[0].name}: ${d.name} selected. ${CREW[1].name}: Systems green. ${CREW[2].name}: Objectives loaded.`)
  }
  const launch = () => { arrivedRef.current = false; altRef.current = 3000; setPhase('transit'); setCrewMsg(`${CREW[0].name}: Launch and transit. Use WASD/Arrows to steer, Shift/Space to thrust toward target.`) }

  const onLandingStatus = useCallback((ok: boolean | null) => {
    if (ok === true) { setLandingStatus('ok'); setCrewMsg(`${CREW[0].name}: Touchdown confirmed. ${CREW[2].name}: Begin exploration.`); setTimeout(()=>setPhase('landed'), reduce?150:700) }
    if (ok === false) { setLandingStatus('fail'); setCrewMsg(`${CREW[1].name}: Hard landing/instability. Retry landing sequence.`) }
  }, [reduce])

  const doObjective = (id: string) => {
    setObjectives(prev => prev.map(o => o.id===id ? { ...o, done: true } : o))
    const obj = objectives.find(o=>o.id===id)
    setCrewMsg(`${CREW[2].name}: ${obj?.label || 'Objective'} complete. Data logged.`)
  }
  const allDone = objectives.length>0 && objectives.every(o=>o.done)

  useEffect(() => {
    if (phase === 'landed' && allDone && !awardedRef.current) {
      awardedRef.current = true
      const s = loadState()
      const gain = 80 + dest.difficulty * 30
      const next = { ...s, profile: { ...s.profile, xp: s.profile.xp + gain, discoveryPoints: s.profile.discoveryPoints + gain, observations: s.profile.observations + objectives.length }, discoveries: Array.from(new Set([...s.discoveries, dest.id])) }
      saveState(unlock(next, dest))
      setPhase('debrief')
    }
  }, [allDone, phase, dest, objectives.length])

  const unlock = (state: ReturnType<typeof loadState>, d: Destination) => {
    const ach = new Set(state.achievements)
    if (state.discoveries.includes('moon') || d.id==='moon') ach.add('solar-explorer-check')
    return { ...state, achievements: [...ach] }
  }

  const hold = (k: string, v: boolean) => { keys.current[k]=v; (window as any).__orbitKeys=keys.current }
  const retryLanding = () => { landing.current = { x: 0, y: 18, vx: 0, vy: 0, fuel: 100 }; setLandingStatus('flying'); setCrewMsg(`${CREW[0].name}: Landing retry. Soft touchdown on the pad.`) }

  return (
    <PageShell className="min-h-[100dvh] lg:h-[100dvh] lg:overflow-hidden">
      {phase === 'select' && (
        <div className="mx-auto max-w-6xl p-4 sm:p-6">
          <Panel className="p-6">
            <HudTag tone="cyan">Play Game</HudTag>
            <h1 className="mt-3 font-[Space_Grotesk] text-4xl font-semibold">Mission: Planetary Exploration</h1>
            <p className="mt-2 max-w-3xl text-text-muted">Control the rocket with your crew, fly to a destination, land safely (where possible), and complete real exploration objectives. This is a learning simulation — visuals are stylized for real-time performance, not GTA-grade photorealism.</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {DESTINATIONS.map(d => (
                <button key={d.id} type="button" onClick={()=>begin(d)} className="rounded-2xl border border-white/10 bg-white/3 p-4 text-left hover:border-cyan/35">
                  <div className="flex items-center justify-between"><span className="font-[Space_Grotesk] text-xl font-semibold" style={{color:d.color}}>{d.name}</span><HudTag tone={d.landable?'green':'amber'}>{d.landable?'Land + Explore':'Orbit Explore'}</HudTag></div>
                  <div className="text-sm text-text-muted">{d.kind} · Gravity {d.gravity}</div>
                  <div className="mt-2 text-sm text-text-muted">What you'll explore: {d.objectives.map(o=>o.label).join(' · ')}</div>
                </button>
              ))}
            </div>
            <div className="mt-4"><Link to="/mission-control"><Button>Back to Mission Control</Button></Link></div>
          </Panel>
        </div>
      )}

      {phase !== 'select' && (
        <div className="grid h-full gap-3 p-3 sm:p-4 lg:grid-cols-[1fr_330px]">
          <Panel className="relative min-h-[56vh] overflow-hidden p-0">
            <div className="absolute inset-0">
              <Canvas dpr={[1,1.5]} gl={{ antialias: true, powerPreference:'high-performance' }}>
                <Suspense fallback={null}>
                  {phase === 'briefing' && (<><color attach="background" args={['#020611']} /><PerspectiveCamera makeDefault position={[0,1.8,6.5]} fov={55} /><ambientLight intensity={0.4}/><directionalLight position={[5,5,5]} intensity={1.5}/><Stars radius={90} depth={50} count={1800} factor={2.5} fade speed={0.2}/><group position={[2.2,0,-3]}><PlanetMesh dest={dest} /></group><group position={[-1.8,-0.3,0]} rotation={[0,0.4,0.15]}><RocketExterior thrust={0.15} /></group></>)}
                  {phase === 'transit' && <TransitScene dest={dest} input={input} view={view} phase={phase} altRef={altRef} onArrive={onArrive} />}
                  {phase === 'landing' && <LandingScene dest={dest} landing={landing} onStatus={onLandingStatus} />}
                  {(phase === 'landed' || phase === 'debrief') && <ExploreScene dest={dest} objectives={objectives} onSelect={doObjective} />}
                </Suspense>
              </Canvas>
            </div>
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,23,0.12),transparent_28%,rgba(3,8,23,0.45))]" />
            <div className="absolute left-3 top-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
              <Panel className="px-3 py-2"><span className="hud-label text-cyan">{dest.name}</span><span className="ml-2 text-sm">{dest.kind}</span></Panel>
              <div className="flex gap-2">
                {(phase==='transit') && <Button onClick={()=>setView(v=>v==='cockpit'?'external':'cockpit')}><Eye size={15}/> {view==='cockpit'?'External':'Cockpit'}</Button>}
                <HudTag tone={phase==='debrief'?'green':phase==='landing'?'amber':'cyan'}>{phase}</HudTag>
              </div>
            </div>

            {phase === 'briefing' && (
              <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-auto bg-bg/30">
                <Panel className="max-w-xl p-6">
                  <h2 className="font-[Space_Grotesk] text-2xl font-semibold">Crew Briefing: {dest.name}</h2>
                  <p className="mt-2 text-sm text-text-muted">{crewMsg}</p>
                  <div className="mt-4"><div className="hud-label">What to explore</div><ul className="mt-2 space-y-1 text-sm text-text-muted">{objectives.map(o=><li key={o.id}>• {o.label} — <span className="text-text-muted/80">{o.hint}</span></li>)}</ul></div>
                  <Button variant="primary" className="mt-5" onClick={launch}><Rocket size={16}/> Launch & Fly</Button>
                </Panel>
              </div>
            )}
            {phase === 'transit' && transitMsg && <div className="absolute bottom-3 left-3 right-3 pointer-events-auto"><Panel className="p-3 text-sm text-cyan">{transitMsg}</Panel></div>}
            {phase === 'landing' && (
              <div className="absolute bottom-3 left-3 right-3 pointer-events-auto flex flex-col gap-2">
                <Panel className="p-3 text-sm"><span className="text-text-muted">Landing: </span><span className="text-text">W / Up / Space</span><span className="text-text-muted"> thrust, </span><span className="text-text">A/D</span><span className="text-text-muted"> drift. Soft touchdown in the cyan zone.</span> <span className={hud.lVy<-2.2?'text-amber':'text-success'}> V.Speed {hud.lVy.toFixed(1)}</span> <span className="text-cyan"> Fuel {Math.round(hud.lFuel)}%</span></Panel>
                {landingStatus==='fail' && <Button variant="primary" onClick={retryLanding}><RotateCcw size={15}/> Retry Landing</Button>}
                <div className="grid grid-cols-3 gap-2 md:hidden"><button type="button" className="rounded-xl border border-cyan/25 bg-cyan/10 p-3 text-cyan" onPointerDown={()=>hold('arrowup',true)} onPointerUp={()=>hold('arrowup',false)} onPointerLeave={()=>hold('arrowup',false)}><ArrowUp className="mx-auto"/></button><div/><div/><button type="button" className="rounded-xl border border-white/10 bg-white/5 p-3" onPointerDown={()=>hold('arrowleft',true)} onPointerUp={()=>hold('arrowleft',false)} onPointerLeave={()=>hold('arrowleft',false)}><ArrowLeft className="mx-auto"/></button><button type="button" className="rounded-xl border border-white/10 bg-white/5 p-3" onPointerDown={()=>hold('arrowdown',true)} onPointerUp={()=>hold('arrowdown',false)} onPointerLeave={()=>hold('arrowdown',false)}><ArrowDown className="mx-auto"/></button><button type="button" className="rounded-xl border border-white/10 bg-white/5 p-3" onPointerDown={()=>hold('arrowright',true)} onPointerUp={()=>hold('arrowright',false)} onPointerLeave={()=>hold('arrowright',false)}><ArrowRight className="mx-auto"/></button></div>
              </div>
            )}
            {phase === 'debrief' && (
              <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-auto bg-bg/35">
                <Panel className="max-w-lg p-6 text-center">
                  <h2 className="font-[Space_Grotesk] text-3xl font-semibold text-success">Exploration Complete</h2>
                  <p className="mt-2 text-text-muted">{dest.name}: all objectives complete. Crew and data logged.</p>
                  <div className="mt-4 flex justify-center gap-3"><Button variant="primary" onClick={()=>setPhase('select')}>New Destination</Button><Link to="/mission-control"><Button>Mission Control</Button></Link></div>
                </Panel>
              </div>
            )}
          </Panel>

          <div className="space-y-3 overflow-auto">
            <Panel className="p-4"><div className="hud-label flex items-center gap-2"><Monitor size={14}/> Flight Instruments</div>
              <div className="mt-3 space-y-2">
                <div><div className="mb-1 flex justify-between text-xs text-text-muted"><span className="flex items-center gap-1"><Gauge size={13}/> Speed</span><span>{hud.speed} km/h</span></div><ProgressBar value={Math.min(100, hud.speed/350)} tone="cyan" /></div>
                <div><div className="mb-1 flex justify-between text-xs text-text-muted"><span className="flex items-center gap-1"><Zap size={13}/> Fuel</span><span>{Math.round(phase==='landing'?hud.lFuel:hud.fuel)}%</span></div><ProgressBar value={phase==='landing'?hud.lFuel:hud.fuel} tone={(phase==='landing'?hud.lFuel:hud.fuel)>25?'green':'amber'} /></div>
                <div><div className="mb-1 flex justify-between text-xs text-text-muted"><span className="flex items-center gap-1"><MapPin size={13}/> Target range</span><span>{Math.round(hud.alt)}</span></div><ProgressBar value={Math.max(0,100-hud.alt/30)} tone="cyan" /></div>
              </div>
            </Panel>
            <Panel className="p-4"><div className="hud-label flex items-center gap-2"><Users size={14}/> Crew (driving & operations)</div>
              <div className="mt-2 space-y-2">{CREW.map(c=>(<div key={c.id} className="rounded-xl border border-white/8 bg-white/3 p-2"><div className="flex items-center justify-between"><span className="font-semibold" style={{color:c.color}}>{c.name}</span><HudTag tone="green">{c.role.split('/')[0].trim()}</HudTag></div><div className="text-xs text-text-muted">{c.role} · {c.status}</div></div>))}</div>
              <div className="mt-3 rounded-xl border border-cyan/15 bg-cyan/5 p-3 text-sm text-text-muted"><Radio size={13} className="inline text-cyan mr-1"/>{crewMsg}</div>
            </Panel>
            <Panel className="p-4"><div className="hud-label flex items-center gap-2"><Scan size={14}/> Exploration objectives</div>
              <div className="mt-2 space-y-2">{objectives.map(o=>(<div key={o.id} className={`rounded-xl border p-2 ${o.done?'border-success/25 bg-success/8':'border-white/8 bg-white/3'}`}><div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{o.label}</span>{o.done?<HudTag tone="green">Done</HudTag>:<HudTag>{o.type}</HudTag>}</div><div className="text-xs text-text-muted">{o.hint}</div>{!o.done && (phase==='landed') && <Button className="mt-2 px-3 py-1.5 text-xs" onClick={()=>doObjective(o.id)}>Perform <ChevronRight size={13}/></Button>}</div>))}</div>
              {phase==='landed' && !allDone && <div className="mt-2 text-xs text-amber">Click objective markers in the 3D view or use Perform buttons.</div>}
            </Panel>
            <Panel className="p-4 text-xs text-text-muted"><Shield size={13} className="inline mr-1"/>Simulation for learning. Planetary visuals/flight are simplified real-time approximations; scientific facts are educational and not live mission telemetry.</Panel>
          </div>
        </div>
      )}
    </PageShell>
  )
}
