import { Suspense, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { motion } from 'framer-motion'
import {
  Globe2,
  Rocket,
  Satellite,
  Shield,
  FlaskConical,
  Trophy,
  Settings,
  Compass,
  LayoutDashboard,
  GraduationCap,
  Orbit,
  Radar,
  ChevronRight,
  Activity,
} from 'lucide-react'
import { PageShell } from '../components/layout/PageShell'
import { EarthGlobe } from '../components/space/EarthGlobe'
import { Starfield } from '../components/space/Starfield'
import { Button } from '../components/ui/Button'
import { Panel, HudTag } from '../components/ui/Panel'
import { ProgressBar } from '../components/ui/Progress'
import { loadState } from '../store/gameStore'
import { coastalWatchMission } from '../data/missions'

function MenuScene() {
  return (
    <>
      <color attach="background" args={['#020611']} />
      <fog attach="fog" args={['#020611', 8, 26]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 2, 5]} intensity={2.2} color="#e8f4ff" />
      <pointLight position={[-6, -2, -3]} intensity={0.7} color="#176bff" />
      <Starfield count={1600} />
      <group position={[1.25, -0.1, 0]} scale={1.05}>
        <EarthGlobe radius={1.72} />
      </group>
      <mesh position={[-2.4, 1.15, -1.8]} rotation={[0.4, 0.8, 0.2]}>
        <torusGeometry args={[0.42, 0.012, 10, 90]} />
        <meshBasicMaterial color="#00d9ff" transparent opacity={0.35} />
      </mesh>
      <mesh position={[-2.4, 1.15, -1.8]}>
        <boxGeometry args={[0.18, 0.06, 0.08]} />
        <meshStandardMaterial color="#8fb7d8" emissive="#0b2d4f" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-2.62, 1.15, -1.8]}>
        <boxGeometry args={[0.22, 0.015, 0.28]} />
        <meshStandardMaterial color="#176bff" emissive="#08244a" metalness={0.4} roughness={0.2} />
      </mesh>
      <mesh position={[-2.18, 1.15, -1.8]}>
        <boxGeometry args={[0.22, 0.015, 0.28]} />
        <meshStandardMaterial color="#176bff" emissive="#08244a" metalness={0.4} roughness={0.2} />
      </mesh>
    </>
  )
}

const mainNav = [
  { to: '/', label: 'Home', icon: Orbit },
  { to: '/mission-control', label: 'Mission Control', icon: LayoutDashboard },
  { to: '/explore', label: 'Explore Universe', icon: Compass },
  { to: '/learning', label: 'Learning Center', icon: GraduationCap },
  { to: '/achievements', label: 'Achievements', icon: Trophy },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const bottomCards = [
  {
    to: '/explore',
    title: 'Solar System',
    desc: 'Navigate planets and orbital paths.',
    icon: Globe2,
    accent: 'from-cyan/20 to-blue/10',
  },
  {
    to: '/satellite-operations',
    title: 'Satellite Operations',
    desc: 'Monitor instruments and observation passes.',
    icon: Satellite,
    accent: 'from-blue/20 to-violet/10',
  },
  {
    to: '/earth-guardians',
    title: 'Earth Guardians',
    desc: 'Protect Earth through science missions.',
    icon: Shield,
    accent: 'from-success/20 to-cyan/10',
  },
  {
    to: '/technology-lab',
    title: 'Technology Lab',
    desc: 'Research upgrades and mission tools.',
    icon: FlaskConical,
    accent: 'from-violet/20 to-blue/10',
  },
]

export function MainMenu() {
  const nav = useNavigate()
  const state = useMemo(() => loadState(), [])
  const mission = coastalWatchMission
  const missionProgress = state.missions[mission.id]

  return (
    <PageShell className="min-h-screen">
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 5.8], fov: 42 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: false }}>
          <Suspense fallback={null}>
            <MenuScene />
          </Suspense>
        </Canvas>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_35%,rgba(3,8,23,0.12),rgba(3,8,23,0.62)_48%,rgba(3,8,23,0.88)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(3,8,23,0.92),rgba(3,8,23,0.28)_38%,rgba(3,8,23,0.18)_62%,rgba(3,8,23,0.82))]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid flex-1 gap-4 lg:grid-cols-[290px_minmax(0,1fr)_320px] lg:gap-5">
          <motion.aside
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
            className="pointer-events-auto flex flex-col"
          >
            <Panel className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan/35 bg-cyan/10 shadow-[0_0_24px_rgba(0,217,255,0.18)]">
                  <Orbit className="text-cyan" size={22} />
                </div>
                <div>
                  <div className="hud-label text-cyan">Guardians of Earth</div>
                  <div className="font-[Space_Grotesk] text-2xl font-semibold tracking-tight text-text">ORBIT</div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-text-muted">
                Command a scientific exploration mission. Observe Earth from orbit, interpret satellite data, and protect our planet through discovery.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <Button variant="primary" className="w-full justify-center py-3" onClick={() => nav('/mission/coastal-watch/briefing')}>
                  <Rocket size={16} /> New Game
                </Button>
                <Button className="w-full justify-center" onClick={() => nav('/mission-control')}>
                  Continue Exploration
                </Button>
                <Button variant="success" className="w-full justify-center" onClick={() => nav('/mission/coastal-watch/briefing')}>
                  <Radar size={16} /> Start Mission
                </Button>
              </div>
            </Panel>

            <Panel className="mt-4 p-3">
              <div className="hud-label mb-2 px-2">Navigation</div>
              <nav className="flex flex-col">
                {mainNav.map((item) => {
                  const Icon = item.icon
                  const active = item.to === '/'
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? 'bg-cyan/10 text-text ring-1 ring-cyan/25' : 'text-text-muted hover:bg-white/4 hover:text-text'}`}
                    >
                      <Icon size={16} className={active ? 'text-cyan' : ''} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </Panel>
          </motion.aside>

          <div className="pointer-events-none hidden min-h-[320px] items-end justify-center pb-4 lg:flex">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.45 }}
              className="pointer-events-auto"
            >
              <Panel className="flex items-center gap-4 px-4 py-3">
                <HudTag tone="green">Live Training Scenario</HudTag>
                <div className="text-sm text-text-muted">
                  <span className="text-text">{mission.title}</span> — practice real Earth observation decision-making.
                </div>
                <Link to="/mission/coastal-watch/briefing" className="ml-1 inline-flex items-center gap-1 text-sm font-semibold text-cyan">
                  Briefing <ChevronRight size={15} />
                </Link>
              </Panel>
            </motion.div>
          </div>

          <motion.aside
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
            className="pointer-events-auto flex flex-col gap-4"
          >
            <Panel className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="hud-label">Player Profile</div>
                  <div className="mt-2 font-[Space_Grotesk] text-xl font-semibold text-text">{state.profile.callsign}</div>
                  <div className="text-sm text-text-muted">{state.profile.rank}</div>
                </div>
                <HudTag tone="cyan">LV {state.profile.level}</HudTag>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-xs text-text-muted">
                    <span>Experience</span>
                    <span>{state.profile.xp % 500} / 500 XP</span>
                  </div>
                  <ProgressBar value={((state.profile.xp % 500) / 500) * 100} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl border border-white/8 bg-white/3 p-2">
                    <div className="font-[Orbitron] text-sm text-cyan">{state.profile.missionsCompleted}</div>
                    <div className="mt-1 text-[11px] text-text-muted">Missions</div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-white/3 p-2">
                    <div className="font-[Orbitron] text-sm text-success">{state.profile.observations}</div>
                    <div className="mt-1 text-[11px] text-text-muted">Observations</div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-white/3 p-2">
                    <div className="font-[Orbitron] text-sm text-violet">{state.profile.researchPoints}</div>
                    <div className="mt-1 text-[11px] text-text-muted">Research</div>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel className="p-5">
              <div className="flex items-center justify-between">
                <div className="hud-label">Current Mission</div>
                <HudTag tone={missionProgress?.status === 'completed' ? 'green' : 'amber'}>
                  {missionProgress?.status === 'completed' ? 'Completed' : 'Available'}
                </HudTag>
              </div>
              <h3 className="mt-3 font-[Space_Grotesk] text-lg font-semibold text-text">{mission.title}</h3>
              <p className="mt-1 text-sm leading-6 text-text-muted">{mission.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <HudTag tone="green">{mission.category}</HudTag>
                <HudTag tone="cyan">{mission.difficulty}</HudTag>
                <HudTag>{mission.duration}</HudTag>
              </div>
              <div className="mt-5 flex gap-2">
                <Link to="/mission/coastal-watch/briefing" className="flex-1">
                  <Button variant="primary" className="w-full">
                    <Activity size={16} /> Open Briefing
                  </Button>
                </Link>
              </div>
            </Panel>
          </motion.aside>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45 }}
          className="pointer-events-auto mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          {bottomCards.map((card) => {
            const Icon = card.icon
            return (
              <Link key={card.to} to={card.to} className="group">
                <Panel className={`h-full bg-gradient-to-br ${card.accent} p-4 transition duration-200 group-hover:border-cyan/45`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-bg/35 text-cyan">
                      <Icon size={18} />
                    </div>
                    <ChevronRight size={16} className="mt-1 text-text-muted transition group-hover:text-cyan" />
                  </div>
                  <div className="mt-3 font-[Space_Grotesk] text-base font-semibold text-text">{card.title}</div>
                  <p className="mt-1 text-sm leading-6 text-text-muted">{card.desc}</p>
                </Panel>
              </Link>
            )
          })}
        </motion.div>

        <div className="pointer-events-auto mt-4 flex items-center justify-center gap-2 lg:hidden">
          <Link to="/mission/coastal-watch/briefing">
            <Button variant="primary">Start Coastal Watch Mission</Button>
          </Link>
        </div>
      </div>
    </PageShell>
  )
}
