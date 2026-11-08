import { Suspense, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Camera, CheckCircle2, ChevronRight, Info, Layers3, MapPin, ScanEye, Target } from 'lucide-react'
import * as THREE from 'three'
import { PageShell } from '../components/layout/PageShell'
import { Panel, HudTag } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/Progress'
import { EarthGlobe } from '../components/space/EarthGlobe'
import { Starfield } from '../components/space/Starfield'
import { coastalWatchMission, overlayMeta, type OverlayKind, type MissionTarget } from '../data/missions'

function latLonToVec3(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)
  return new THREE.Vector3(x, y, z)
}

function TargetMarker({ target, radius, active }: { target: MissionTarget; radius: number; active: boolean }) {
  const pos = latLonToVec3(target.lat, target.lon, radius + 0.03)
  return (
    <group position={pos}>
      <mesh>
        <sphereGeometry args={[active ? 0.038 : 0.024, 16, 16]} />
        <meshBasicMaterial color={active ? '#00d9ff' : '#46e58a'} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[active ? 0.055 : 0.04, active ? 0.075 : 0.052, 40]} />
        <meshBasicMaterial color={active ? '#00d9ff' : '#46e58a'} transparent opacity={active ? 0.8 : 0.45} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function MissionScene({ target, targets, overlay, foundIds }: { target: MissionTarget; targets: MissionTarget[]; overlay: OverlayKind; foundIds: string[] }) {
  const tint = overlayMeta[overlay].tint
  return (
    <>
      <color attach="background" args={['#020611']} />
      <ambientLight intensity={0.34} />
      <directionalLight position={[4.5, 1.5, 4.5]} intensity={2.1} color="#edf6ff" />
      <pointLight position={[-5, 0, -3]} intensity={0.55} color="#176bff" />
      <Starfield count={1200} />
      <group rotation={[0.18, -target.lon * (Math.PI / 180) * 0.55, 0]}>
        <EarthGlobe radius={1.68} rotate={false} />
        <mesh scale={1.02}>
          <sphereGeometry args={[1.68, 48, 48]} />
          <meshBasicMaterial color={tint} transparent opacity={0.55} depthWrite={false} />
        </mesh>
        {targets.map((t) => (
          <TargetMarker key={t.id} target={t} radius={1.68} active={t.id === target.id || foundIds.includes(t.id)} />
        ))}
      </group>
      <OrbitControls enablePan={false} minDistance={3.2} maxDistance={6.8} rotateSpeed={0.55} zoomSpeed={0.7} />
    </>
  )
}

export function CoastalWatchMissionPage() {
  const nav = useNavigate()
  const mission = coastalWatchMission
  const [index, setIndex] = useState(0)
  const [overlay, setOverlay] = useState<OverlayKind>('true-color')
  const [answers, setAnswers] = useState<Record<string, { overlay: OverlayKind; correct: boolean }>>({})
  const [feedback, setFeedback] = useState<null | { correct: boolean }>(null)
  const [showMobileInfo, setShowMobileInfo] = useState(false)

  const target = mission.targets[index]
  const foundIds = useMemo(() => Object.keys(answers).filter((id) => answers[id].correct), [answers])
  const capturedCount = Object.keys(answers).length
  const correctCount = Object.values(answers).filter((a) => a.correct).length
  const progress = (capturedCount / mission.targets.length) * 100
  const answered = !!answers[target.id]

  const capture = () => {
    if (answered) return
    const correct = overlay === target.correctOverlay
    setAnswers((prev) => ({ ...prev, [target.id]: { overlay, correct } }))
    setFeedback({ correct })
  }

  const next = () => {
    setFeedback(null)
    if (index < mission.targets.length - 1) {
      setIndex((i) => i + 1)
      setOverlay('true-color')
    } else {
      const accuracy = Math.round((correctCount / mission.targets.length) * 100)
      const score = correctCount * 340 + 80
      nav('/mission/coastal-watch/results', {
        state: {
          score,
          accuracy,
          correct: correctCount,
          total: mission.targets.length,
          answers,
        },
      })
    }
  }

  return (
    <PageShell className="h-[100dvh] overflow-hidden">
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0.1, 4.7], fov: 42 }} dpr={[1, 1.6]} gl={{ antialias: true }}>
          <Suspense fallback={null}>
            <MissionScene target={target} targets={mission.targets} overlay={overlay} foundIds={foundIds} />
          </Suspense>
        </Canvas>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(3,8,23,0.88),rgba(3,8,23,0.18)_26%,rgba(3,8,23,0.14)_72%,rgba(3,8,23,0.88)),linear-gradient(180deg,rgba(3,8,23,0.58),rgba(3,8,23,0.08)_35%,rgba(3,8,23,0.72))]" />

      <div className="relative z-10 flex h-full flex-col p-3 sm:p-4">
        <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link to="/mission/coastal-watch/briefing" className="rounded-full border border-cyan/25 bg-bg-secondary/65 px-3 py-2 text-sm backdrop-blur-md hover:border-cyan/45">Briefing</Link>
            <Panel className="px-3 py-2">
              <span className="hud-label text-cyan">Coastal Watch</span>
              <span className="ml-2 text-sm text-text-muted">Earth Observation Deck</span>
            </Panel>
          </div>
          <div className="flex items-center gap-2">
            <HudTag tone="green">Simulated Training Overlays</HudTag>
            <Panel className="hidden px-3 py-2 text-sm text-text-muted sm:block">Progress: <span className="font-[Orbitron] text-cyan">{capturedCount}/{mission.targets.length}</span></Panel>
            <button type="button" className="rounded-full border border-white/10 bg-bg-secondary/65 px-3 py-2 text-sm md:hidden" onClick={() => setShowMobileInfo((v) => !v)}>
              <Info size={16} />
            </button>
          </div>
        </div>

        <div className="mt-3 grid min-h-0 flex-1 gap-3 md:grid-cols-[290px_minmax(0,1fr)_320px]">
          <Panel className={`pointer-events-auto overflow-auto p-4 ${showMobileInfo ? '' : 'hidden md:block'}`}>
            <div className="hud-label">Mission Objectives</div>
            <div className="mt-3 space-y-2">
              {mission.targets.map((t, i) => {
                const a = answers[t.id]
                return (
                  <div key={t.id} className={`rounded-xl border p-3 ${t.id === target.id ? 'border-cyan/35 bg-cyan/8' : 'border-white/8 bg-white/3'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-[Orbitron] text-[10px] tracking-[0.14em] text-text-muted">ZONE 0{i + 1}</span>
                      {a && <CheckCircle2 size={14} className={a.correct ? 'text-success' : 'text-amber'} />}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-text">{t.name}</div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-text-muted"><span>Observations captured</span><span>{Math.round(progress)}%</span></div>
              <ProgressBar value={progress} tone="green" />
            </div>
            <div className="mt-4 rounded-xl border border-cyan/20 bg-cyan/6 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-text"><Target size={15} className="text-cyan" /> Active Target</div>
              <p className="mt-2 text-sm leading-6 text-text-muted">{target.prompt}</p>
            </div>
          </Panel>

          <div className="pointer-events-none hidden md:block" />

          <Panel className={`pointer-events-auto overflow-auto p-4 ${showMobileInfo ? '' : 'hidden md:block'}`}>
            <div className="hud-label">Selected Region</div>
            <div className="mt-2 flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 text-cyan" />
              <div>
                <div className="font-[Space_Grotesk] text-lg font-semibold text-text">{target.name}</div>
                <div className="text-xs text-text-muted">Approx. {Math.abs(target.lat)}°{target.lat >= 0 ? 'N' : 'S'}, {Math.abs(target.lon)}°{target.lon >= 0 ? 'E' : 'W'}</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="hud-label">Active Layer</div>
              <div className="mt-2 rounded-xl border border-white/8 bg-white/3 p-3">
                <div className="font-semibold text-text">{overlayMeta[overlay].label}</div>
                <p className="mt-1 text-sm leading-6 text-text-muted">{overlayMeta[overlay].description}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="hud-label">Scientific Context</div>
              <p className="mt-2 text-sm leading-6 text-text-muted">{target.nasaContext}</p>
            </div>
            <AnimatePresence>
              {feedback && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`mt-4 rounded-xl border p-3 ${feedback.correct ? 'border-success/30 bg-success/10' : 'border-amber/30 bg-amber/10'}`}>
                  <div className={`font-semibold ${feedback.correct ? 'text-success' : 'text-amber'}`}>{feedback.correct ? 'Observation captured' : 'Observation needs review'}</div>
                  <p className="mt-1 text-sm leading-6 text-text-muted">{feedback.correct ? target.explanation : `Best fit: ${overlayMeta[target.correctOverlay].label}. ${target.explanation}`}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Panel>
        </div>

        <div className="pointer-events-auto mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
          <Panel className="p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2"><Layers3 size={16} className="text-cyan" /><span className="hud-label">Observation Layers</span></div>
              <span className="text-xs text-text-muted">Choose a layer, then capture</span>
            </div>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {(Object.keys(overlayMeta) as OverlayKind[]).map((kind) => {
                const meta = overlayMeta[kind]
                const active = overlay === kind
                return (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setOverlay(kind)}
                    className={`rounded-xl border p-3 text-left transition ${active ? 'border-cyan/45 bg-cyan/10 shadow-[0_0_20px_rgba(0,217,255,0.12)]' : 'border-white/8 bg-white/3 hover:border-white/15'}`}
                  >
                    <div className="font-semibold text-text">{meta.label}</div>
                    <div className="mt-1 text-[11px] leading-5 text-text-muted">{meta.description}</div>
                  </button>
                )
              })}
            </div>
          </Panel>
          <Panel className="flex flex-col justify-center gap-2 p-3 sm:p-4">
            {!answered ? (
              <Button variant="primary" className="w-full py-3 lg:min-w-[220px]" onClick={capture}>
                <Camera size={16} /> Capture Observation
              </Button>
            ) : (
              <Button variant={feedback?.correct ? 'success' : 'primary'} className="w-full py-3 lg:min-w-[220px]" onClick={next}>
                {index < mission.targets.length - 1 ? 'Next Zone' : 'View Mission Report'} <ChevronRight size={16} />
              </Button>
            )}
            <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
              <ScanEye size={14} /> Accuracy: {capturedCount ? Math.round((correctCount / capturedCount) * 100) : 100}%
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  )
}
