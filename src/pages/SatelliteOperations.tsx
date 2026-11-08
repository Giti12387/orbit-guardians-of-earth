import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { PageShell } from '../components/layout/PageShell'
import { Panel, HudTag } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/Progress'
import { NasaSourceBadge } from '../components/ui/NasaSourceBadge'
import { satelliteCatalog } from '../data/catalog'
import { fetchEonetStatus, gibsPreviewUrl, NASA_SOURCES } from '../lib/nasaData'

export function SatelliteOperations() {
  const [satId, setSatId] = useState(satelliteCatalog[0].id)
  const [layerMode, setLayerMode] = useState('True Color')
  const [eonet, setEonet] = useState<{ state: 'loading' | 'ok' | 'error'; message: string; count?: number; date?: string }>({ state: 'loading', message: 'Checking NASA EONET...' })
  const sat = satelliteCatalog.find((s) => s.id === satId)!
  const gibs = gibsPreviewUrl()

  useEffect(() => {
    const ac = new AbortController()
    fetchEonetStatus(ac.signal).then((r) => setEonet(r.ok ? { state: 'ok', message: r.message, count: r.count, date: r.date } : { state: 'error', message: r.message, date: r.date })).catch(() => {})
    return () => ac.abort()
  }, [])

  return (
    <PageShell backTo="/mission-control" backLabel="Mission Control" className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <Panel className="p-6"><div className="hud-label text-cyan">Satellite Operations</div><h1 className="mt-2 font-[Space_Grotesk] text-3xl font-semibold">Orbital Observation Console</h1></Panel>
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Panel className="p-5">
            <div className="hud-label">Satellite Selection</div>
            <div className="mt-3 space-y-2">{satelliteCatalog.map((s) => (
              <button key={s.id} type="button" onClick={() => setSatId(s.id)} className={`w-full rounded-xl border p-3 text-left ${satId === s.id ? 'border-cyan/45 bg-cyan/10' : 'border-white/8 bg-white/3'}`}>
                <div className="flex items-center justify-between"><span className="font-semibold">{s.name}</span><HudTag tone="green">{s.status}</HudTag></div>
                <div className="mt-1 text-sm text-text-muted">{s.orbit} · {s.focus}</div>
              </button>
            ))}</div>
            <div className="mt-5 rounded-xl border border-white/8 bg-white/3 p-4">
              <div className="hud-label">Satellite Status</div>
              <div className="mt-3 space-y-3 text-sm">
                <div><div className="mb-1 flex justify-between text-text-muted"><span>Power</span><span>94%</span></div><ProgressBar value={94} tone="green" /></div>
                <div><div className="mb-1 flex justify-between text-text-muted"><span>Signal</span><span>91%</span></div><ProgressBar value={91} tone="cyan" /></div>
                <div><div className="mb-1 flex justify-between text-text-muted"><span>Observation queue</span><span>3 objectives</span></div><ProgressBar value={60} tone="amber" /></div>
              </div>
              <div className="mt-3 text-sm text-text-muted">Instruments: {sat.instruments.join(', ')}</div>
            </div>
          </Panel>
          <div className="space-y-4">
            <Panel className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2"><div className="hud-label">Orbit Visualization & Observation</div><HudTag tone="cyan">{sat.name}</HudTag></div>
              <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr]">
                <div className="relative flex aspect-square items-center justify-center rounded-2xl border border-cyan/15 bg-[radial-gradient(circle,rgba(0,217,255,0.08),rgba(3,8,23,0.2))]">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 shadow-[0_0_30px_rgba(23,107,255,0.35)]" />
                  <div className="absolute h-[78%] w-[78%] rounded-full border border-cyan/35" style={{ transform: 'rotateX(68deg)' }} />
                  <motion.div className="absolute h-[78%] w-[78%]" style={{ transform: 'rotateX(68deg)' }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}>
                    <div className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-cyan shadow-[0_0_12px_rgba(0,217,255,0.9)]" />
                  </motion.div>
                </div>
                <div>
                  <div className="hud-label">Observation Data Layers</div>
                  <div className="mt-2 flex flex-wrap gap-2">{['True Color', 'Thermal', 'Vegetation', 'Storm'].map((m) => <Button key={m} variant={layerMode === m ? 'primary' : 'secondary'} onClick={() => setLayerMode(m)}>{m}</Button>)}</div>
                  <div className="mt-4 rounded-xl border border-white/8 bg-white/3 p-4 text-sm text-text-muted">
                    <div className="font-semibold text-text">Active layer: {layerMode}</div>
                    <p className="mt-1">Training interface displays layer intent and source attribution. Real/archived NASA imagery can be explored through GIBS; when external requests are unavailable, ORBIT keeps the mission playable with labeled demo context.</p>
                    <div className="mt-2 text-xs">GIBS reference layer: {gibs.layer} · date {gibs.date}</div>
                  </div>
                </div>
              </div>
            </Panel>
            <Panel className="p-5">
              <div className="flex items-center justify-between gap-2"><div className="hud-label">NASA Service Status</div><HudTag tone={eonet.state === 'ok' ? 'green' : eonet.state === 'loading' ? 'cyan' : 'amber'}>{eonet.state}</HudTag></div>
              <p className="mt-2 text-sm text-text-muted">{eonet.state === 'ok' ? `${eonet.message} Open events in sample: ${eonet.count ?? 0} (${eonet.date}).` : `${eonet.message} Showing fallback/demo-safe status.`}</p>
              <div className="mt-4">
                <NasaSourceBadge sources={[
                  { name: NASA_SOURCES.eonet.name, date: eonet.date || new Date().toISOString().slice(0,10), type: eonet.state === 'ok' ? 'real' : 'simulated', url: NASA_SOURCES.eonet.url, note: eonet.state === 'ok' ? 'Live API check' : 'Fallback status' },
                  { name: NASA_SOURCES.gibs.name, date: gibs.date, type: 'archived', url: NASA_SOURCES.gibs.url, note: 'Layer reference' },
                  { name: NASA_SOURCES.firms.name, date: 'Referenced', type: 'archived', url: NASA_SOURCES.firms.url },
                ]} />
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
