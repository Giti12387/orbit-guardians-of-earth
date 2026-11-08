import { useEffect, useMemo, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Award, BookOpenCheck, Compass, Database, FlaskConical, Orbit, RotateCcw, SatelliteDish, Sparkles } from 'lucide-react'
import { PageShell } from '../components/layout/PageShell'
import { Panel, HudTag } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/Progress'
import { completeMission } from '../store/gameStore'
import { coastalWatchMission, overlayMeta, type OverlayKind } from '../data/missions'

type ResultState = {
  score?: number
  accuracy?: number
  correct?: number
  total?: number
  answers?: Record<string, { overlay: OverlayKind; correct: boolean }>
}

export function MissionResults() {
  const location = useLocation()
  const result = (location.state || {}) as ResultState
  const mission = coastalWatchMission
  const committed = useRef(false)

  const computed = useMemo(() => {
    const total = result.total ?? mission.targets.length
    const correct = result.correct ?? 0
    const accuracy = result.accuracy ?? Math.round((correct / total) * 100)
    const score = result.score ?? correct * 340 + 80
    const xp = 150 + correct * 90
    const research = 40 + correct * 35
    const discovery = 20 + correct * 25
    const observations = total
    return { total, correct, accuracy, score, xp, research, discovery, observations }
  }, [result, mission.targets.length])

  useEffect(() => {
    if (committed.current) return
    committed.current = true
    if (!result.score && !result.accuracy && !result.answers) return
    completeMission(mission.id, {
      score: computed.score,
      accuracy: computed.accuracy,
      xp: computed.xp,
      research: computed.research,
      discovery: computed.discovery,
      observations: computed.observations,
      missionName: mission.title,
      objectivesCompleted: computed.correct,
      objectivesTotal: computed.total,
      findings: mission.targets.map((t) => `${t.name}: ${t.explanation}`),
      summary:
        'Coastal Watch training completed using simulated observation overlays to practice evidence-based environmental interpretation.',
      sources: [
        { name: 'NASA Earthdata / Earth observation concepts (educational reference)', date: 'Accessed in demo', type: 'simulated' },
        { name: 'Mission training overlay set (ORBIT)', date: new Date().toISOString().slice(0, 10), type: 'simulated' },
      ],
    })
  }, [computed, mission, result])

  return (
    <PageShell backTo="/" backLabel="Main Menu" className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_420px_at_50%_10%,rgba(70,229,138,0.16),transparent_55%),radial-gradient(900px_500px_at_15%_80%,rgba(0,217,255,0.1),transparent_60%)]" />
      <div className="relative mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Panel className="scanline p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="hud-label text-success">Mission Completed</div>
                <h1 className="mt-3 font-[Space_Grotesk] text-3xl font-semibold text-text sm:text-5xl">{mission.title} Report</h1>
                <p className="mt-3 max-w-2xl text-text-muted">You completed an Earth observation investigation. The report below separates your results from the scientific purpose behind each choice.</p>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-success/25 bg-success/10 px-4 py-3">
                <Award className="text-success" size={22} />
                <div>
                  <div className="hud-label text-success">Total Score</div>
                  <div className="font-[Orbitron] text-2xl text-text">{computed.score}</div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              {[
                { label: 'Accuracy', value: `${computed.accuracy}%`, tone: 'text-cyan', icon: <SatelliteDish size={16} className="text-cyan" /> },
                { label: 'XP Earned', value: `+${computed.xp}`, tone: 'text-success', icon: <Sparkles size={16} className="text-success" /> },
                { label: 'Research', value: `+${computed.research}`, tone: 'text-violet', icon: <FlaskConical size={16} className="text-violet" /> },
                { label: 'Discovery', value: `+${computed.discovery}`, tone: 'text-amber', icon: <Database size={16} className="text-amber" /> },
                { label: 'Observations', value: `${computed.observations}`, tone: 'text-cyan', icon: <Orbit size={16} className="text-cyan" /> },
                { label: 'Objectives', value: `${computed.correct}/${computed.total}`, tone: 'text-text', icon: <BookOpenCheck size={16} className="text-cyan" /> },
              ].map((s) => (
                <Panel key={s.label} className="bg-bg/25 p-4">
                  <div className="flex items-center justify-between"><span className="hud-label">{s.label}</span>{s.icon}</div>
                  <div className={`mt-3 font-[Orbitron] text-xl ${s.tone}`}>{s.value}</div>
                </Panel>
              ))}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
              <Panel className="bg-bg/25 p-5">
                <div className="hud-label">Mission Performance</div>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-text-muted"><span>Observation accuracy</span><span>{computed.accuracy}%</span></div>
                  <ProgressBar value={computed.accuracy} tone={computed.accuracy >= 67 ? 'green' : 'amber'} />
                </div>
                <div className="mt-5 space-y-3">
                  {mission.targets.map((t) => {
                    const a = result.answers?.[t.id]
                    return (
                      <div key={t.id} className="rounded-xl border border-white/8 bg-white/3 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold text-text">{t.name}</div>
                          {a ? <HudTag tone={a.correct ? 'green' : 'amber'}>{a.correct ? 'Correct' : 'Review'}</HudTag> : <HudTag>Logged</HudTag>}
                        </div>
                        <div className="mt-1 text-sm text-text-muted">
                          Selected: {a ? overlayMeta[a.overlay].label : '—'} · Best fit: {overlayMeta[t.correctOverlay].label}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Panel>
              <Panel className="bg-bg/25 p-5">
                <div className="hud-label">Scientific Explanation</div>
                <p className="mt-3 text-sm leading-7 text-text-muted">
                  Earth observation is not about a single picture. Scientists choose instruments and data products based on the question: water extent, vegetation condition, heat patterns, and change over time can each require a different view.
                </p>
                <div className="mt-4 rounded-xl border border-amber/25 bg-amber/8 p-3 text-sm leading-6 text-[#ffd487]">
                  <strong className="font-semibold text-amber">Scientific integrity:</strong> The overlays in this training mission are simulated for learning. Real NASA Earth observations involve instrument calibration, timestamps, geographic context, and comparison across dates.
                </div>
                <div className="mt-4 space-y-2 text-sm leading-6 text-text-muted">
                  {mission.targets.map((t) => (
                    <p key={t.id}><span className="text-text">{t.name}:</span> {t.explanation}</p>
                  ))}
                </div>
                <div className="mt-4 rounded-xl border border-cyan/20 bg-cyan/6 p-4">
                  <div className="hud-label text-cyan">Data Sources</div>
                  <ul className="mt-2 space-y-1 text-sm text-text-muted">
                    <li>NASA Earthdata / Earth observation concepts — educational reference (simulated training context).</li>
                    <li>ORBIT training overlay set — {new Date().toISOString().slice(0, 10)} (simulated).</li>
                  </ul>
                </div>
              </Panel>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/mission/coastal-watch/briefing"><Button variant="primary"><RotateCcw size={16} /> Replay Mission</Button></Link>
              <Link to="/mission-control"><Button><Compass size={16} /> Mission Control</Button></Link>
              <Link to="/earth-guardians"><Button>Earth Guardians</Button></Link>
              <Link to="/"><Button>Return to Main Menu</Button></Link>
            </div>
          </Panel>
        </motion.div>
      </div>
    </PageShell>
  )
}
