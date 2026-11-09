import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Clock3, Crosshair, Shield, Telescope } from 'lucide-react'
import { PageShell } from '../components/layout/PageShell'
import { Panel, HudTag } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { coastalWatchMission } from '../data/missions'

export function MissionBriefing() {
  const m = coastalWatchMission
  return (
    <PageShell backTo="/" backLabel="Main Menu" className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_420px_at_20%_15%,rgba(70,229,138,0.14),transparent_55%),radial-gradient(900px_500px_at_80%_30%,rgba(0,217,255,0.12),transparent_60%)]" />
      <div className="relative mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45 }}>
          <Panel className="scanline overflow-hidden p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="hud-label text-success">Cinematic Mission Briefing</div>
                <h1 className="mt-3 font-[Space_Grotesk] text-3xl font-semibold text-text sm:text-5xl">{m.title}</h1>
                <p className="mt-2 font-[Orbitron] text-sm tracking-[0.16em] text-cyan">{m.codename.toUpperCase()}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <HudTag tone="green">{m.category}</HudTag>
                <HudTag tone="cyan">{m.difficulty}</HudTag>
                <HudTag><span className="inline-flex items-center gap-1"><Clock3 size={11} /> {m.duration}</span></HudTag>
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <Panel className="bg-bg/25 p-5">
                  <div className="hud-label">Scientific Background</div>
                  <p className="mt-3 text-sm leading-7 text-text-muted">{m.scientificBackground}</p>
                  <div className="mt-4 rounded-xl border border-amber/25 bg-amber/8 p-3 text-sm leading-6 text-[#ffd487]">
                    <strong className="font-semibold text-amber">Data note:</strong> This mission uses simulated training overlays inspired by Earth observation concepts. It teaches how scientists choose views; it does not claim to display live NASA imagery.
                  </div>
                </Panel>
                <Panel className="bg-bg/25 p-5">
                  <div className="hud-label">Mission Objectives</div>
                  <div className="mt-4 space-y-3">
                    {m.objectives.map((o, i) => (
                      <div key={o} className="flex items-start gap-3 rounded-xl border border-white/7 bg-white/3 p-3">
                        <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg border border-cyan/25 bg-cyan/10 font-[Orbitron] text-xs text-cyan">0{i + 1}</div>
                        <div className="text-sm leading-6 text-text-muted">{o}</div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>

              <div className="space-y-4">
                <Panel className="bg-bg/25 p-5">
                  <div className="hud-label">Interactive Challenge</div>
                  <p className="mt-3 text-sm leading-7 text-text-muted">
                    You will inspect three investigation zones from orbit. For each zone, read the scientific question, choose the observation layer that best answers it, and capture your observation.
                  </p>
                  <div className="mt-4 space-y-2 text-sm text-text-muted">
                    <div className="flex items-center gap-2"><Crosshair size={15} className="text-cyan" /> Select zones and compare evidence.</div>
                    <div className="flex items-center gap-2"><Telescope size={15} className="text-cyan" /> Match the layer to the question.</div>
                    <div className="flex items-center gap-2"><Shield size={15} className="text-cyan" /> Use science to support Earth protection decisions.</div>
                  </div>
                </Panel>
                <Panel className="border-success/25 bg-[linear-gradient(180deg,rgba(70,229,138,0.09),rgba(8,22,43,0.45))] p-5">
                  <div className="hud-label text-success">Ready for Launch</div>
                  <div className="mt-3 font-[Space_Grotesk] text-xl font-semibold">Enter the observation deck</div>
                  <p className="mt-2 text-sm leading-6 text-text-muted">Your performance will generate a mission report with score, accuracy, and scientific explanation.</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link to="/mission/coastal-watch" className="flex-1">
                      <Button variant="primary" className="w-full py-3">
                        Launch Mission <ArrowRight size={16} />
                      </Button>
                    </Link>
                  </div>
                </Panel>
              </div>
            </div>
          </Panel>
        </motion.div>
      </div>
    </PageShell>
  )
}
