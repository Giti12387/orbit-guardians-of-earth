import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { PageShell } from '../components/layout/PageShell'
import { useSettings, prefersReducedMotion } from '../lib/settings'
import { Panel, HudTag } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/Progress'
import { NasaSourceBadge } from '../components/ui/NasaSourceBadge'
import { satelliteCatalog } from '../data/catalog'
import { fetchEonetStatus, fetchFirmsArea, fetchPowerDaily, getFirmsConfig, gibsWmsImageUrl, NASA_SOURCES, recentGibsDate } from '../lib/nasaData'

const GIBS_LAYERS = [
  { id: 'MODIS_Terra_CorrectedReflectance_TrueColor', label: 'True Color (MODIS Terra)' },
  { id: 'VIIRS_NOAA20_CorrectedReflectance_TrueColor', label: 'True Color (VIIRS NOAA-20)' },
  { id: 'MODIS_Terra_Land_Surface_Temp_Day', label: 'Land Surface Temp Day (MODIS Terra)' },
]

export function SatelliteOperations() {
  const { settings } = useSettings()
  const reduceMotion = prefersReducedMotion(settings)
  const [satId, setSatId] = useState(satelliteCatalog[0].id)
  const [layer, setLayer] = useState(GIBS_LAYERS[0].id)
  const [date, setDate] = useState(recentGibsDate(2))
  const [imgError, setImgError] = useState(false)
  const [lat, setLat] = useState('14.6')
  const [lon, setLon] = useState('120.98')
  const [eonet, setEonet] = useState<{ state: 'loading' | 'ok' | 'error'; message: string; count?: number; date?: string }>({ state: 'loading', message: 'Checking NASA EONET...' })
  const [power, setPower] = useState<{ state: 'idle' | 'loading' | 'ok' | 'error'; payload?: any; message?: string }>({ state: 'idle' })
  const [firms, setFirms] = useState<{ state: 'idle' | 'loading' | 'ok' | 'blocked' | 'error'; message?: string; count?: number; date?: string }>({ state: 'idle' })
  const [captured, setCaptured] = useState<string[]>([])
  const sat = satelliteCatalog.find((s) => s.id === satId)!
  const gibs = useMemo(() => gibsWmsImageUrl({ layer, date }), [layer, date])
  const firmsCfg = getFirmsConfig()

  useEffect(() => {
    const ac = new AbortController()
    fetchEonetStatus(ac.signal).then((r) => setEonet(r.ok ? { state: 'ok', message: r.message, count: r.count, date: r.date } : { state: 'error', message: r.message, date: r.date })).catch(() => {})
    return () => ac.abort()
  }, [])

  useEffect(() => { setImgError(false) }, [gibs.url])

  const loadPower = async () => {
    setPower({ state: 'loading' })
    const ac = new AbortController()
    const r = await fetchPowerDaily({ lat: Number(lat), lon: Number(lon) }, ac.signal)
    setPower(r.ok ? { state: 'ok', payload: r } : { state: 'error', message: r.message, payload: r })
  }

  const loadFirms = async () => {
    setFirms({ state: 'loading' })
    const r = await fetchFirmsArea({ area: 'world', dayRange: 1 })
    if (r.ok) setFirms({ state: 'ok', message: r.message, count: r.count, date: r.date })
    else setFirms({ state: r.type === 'blocked' ? 'blocked' : 'error', message: r.message, date: r.date })
  }

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
              <div className="mt-3 space-y-3 text-sm"><div><div className="mb-1 flex justify-between text-text-muted"><span>Power</span><span>94%</span></div><ProgressBar value={94} tone="green" /></div><div><div className="mb-1 flex justify-between text-text-muted"><span>Signal</span><span>91%</span></div><ProgressBar value={91} tone="cyan" /></div><div><div className="mb-1 flex justify-between text-text-muted"><span>Captured objectives</span><span>{captured.length}</span></div><ProgressBar value={Math.min(100, captured.length * 25)} tone="amber" /></div></div>
              <div className="mt-3 text-sm text-text-muted">Instruments: {sat.instruments.join(', ')}</div>
              <Button className="mt-3" onClick={() => setCaptured((c) => c.includes(`${sat.id}-${layer}-${date}`) ? c : [...c, `${sat.id}-${layer}-${date}`])}>Capture Observation Objective</Button>
            </div>
          </Panel>
          <div className="space-y-4">
            <Panel className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2"><div className="hud-label">NASA GIBS Imagery (Actual WMS Request)</div><HudTag tone={imgError ? 'amber' : 'cyan'}>{imgError ? 'Fallback' : 'Live/archived request'}</HudTag></div>
              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                <select className="rounded-xl border border-white/10 bg-bg/40 px-3 py-2 text-sm" value={layer} onChange={(e) => setLayer(e.target.value)}>{GIBS_LAYERS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}</select>
                <input className="rounded-xl border border-white/10 bg-bg/40 px-3 py-2 text-sm" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                {!imgError ? (
                  <img src={gibs.url} alt={`NASA GIBS ${gibs.layer} ${gibs.date}`} className="h-auto w-full" onError={() => setImgError(true)} loading="lazy" />
                ) : (
                  <div className="p-6 text-sm text-text-muted">GIBS imagery could not be loaded in this environment. The request URL, layer, date, and projection are shown below; gameplay remains functional.</div>
                )}
              </div>
              <div className="mt-3 text-xs text-text-muted break-all">Layer: {gibs.layer} · Date: {gibs.date} · Projection: {gibs.projection} · Source: {gibs.source}</div>
              <div className="mt-2"><NasaSourceBadge sources={[{ name: NASA_SOURCES.gibs.name, date: gibs.date, type: imgError ? 'archived' : 'archived', url: NASA_SOURCES.gibs.url, note: 'WMS GetMap imagery request (archived/date-selected)' }]} /></div>
            </Panel>

            <Panel className="p-5">
              <div className="hud-label">NASA POWER Environmental Data</div>
              <p className="mt-2 text-sm text-text-muted">Fetch daily environmental variables for a geographic coordinate (real API request with fallback).</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <input className="rounded-xl border border-white/10 bg-bg/40 px-3 py-2 text-sm" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitude" />
                <input className="rounded-xl border border-white/10 bg-bg/40 px-3 py-2 text-sm" value={lon} onChange={(e) => setLon(e.target.value)} placeholder="Longitude" />
                <Button variant="primary" onClick={loadPower} disabled={power.state === 'loading'}>{power.state === 'loading' ? 'Loading...' : 'Fetch POWER'}</Button>
              </div>
              {power.state === 'ok' && <div className="mt-3 rounded-xl border border-success/25 bg-success/8 p-3 text-sm text-text-muted"><div className="font-semibold text-success">POWER response received</div><div>Coordinates: {power.payload.coordinates.lat}, {power.payload.coordinates.lon} · Date range: {power.payload.date} · Parameters: {power.payload.parameters}</div></div>}
              {power.state === 'error' && <div className="mt-3 rounded-xl border border-amber/25 bg-amber/8 p-3 text-sm text-text-muted"><div className="font-semibold text-amber">POWER fallback</div><div>{power.message}. Using labeled fallback context; source attribution preserved.</div></div>}
              <div className="mt-3"><NasaSourceBadge sources={[{ name: NASA_SOURCES.power.name, date: power.payload?.date || 'Requested on demand', type: power.state === 'ok' ? 'real' : 'archived', url: NASA_SOURCES.power.url, note: 'Daily point API for T2M, PRECTOTCORR, RH2M' }]} /></div>
            </Panel>

            <Panel className="p-5">
              <div className="flex items-center justify-between gap-2"><div className="hud-label">NASA FIRMS Fire Observations</div><HudTag tone={firms.state === 'ok' ? 'green' : firms.state === 'blocked' ? 'amber' : 'cyan'}>{firms.state || 'idle'}</HudTag></div>
              <p className="mt-2 text-sm text-text-muted">Valid FIRMS API access requires a MAP_KEY (`VITE_FIRMS_MAP_KEY`). Live observations are shown only when a valid key is configured and the request succeeds.</p>
              <div className="mt-3 flex flex-wrap gap-2"><Button onClick={loadFirms} disabled={firms.state === 'loading'}>{firms.state === 'loading' ? 'Checking...' : 'Check FIRMS'}</Button><HudTag tone={firmsCfg.hasKey ? 'cyan' : 'amber'}>{firmsCfg.hasKey ? 'MAP_KEY configured' : 'MAP_KEY missing'}</HudTag></div>
              {firms.message && <div className={`mt-3 rounded-xl border p-3 text-sm text-text-muted ${firms.state === 'ok' ? 'border-success/25 bg-success/8' : 'border-amber/25 bg-amber/8'}`}>{firms.state === 'ok' ? `Real/near-real-time FIRMS response: ${firms.count} record(s) in sample (world, 1 day). ${firms.date}.` : firms.message}</div>}
              <div className="mt-3"><NasaSourceBadge sources={[{ name: NASA_SOURCES.firms.name, date: firms.date || 'On demand', type: firms.state === 'ok' ? 'real' : 'simulated', url: NASA_SOURCES.firms.url, note: firms.state === 'ok' ? 'VIIRS SNPP NRT area request' : 'No live data shown without valid API access' }]} /></div>
            </Panel>

            <Panel className="p-5"><div className="hud-label">EONET / Orbit</div><div className="mt-2 text-sm text-text-muted">EONET status: <HudTag tone={eonet.state === 'ok' ? 'green' : 'amber'}>{eonet.state}</HudTag> {eonet.message} {eonet.count != null ? `(${eonet.count} open events)` : ''}</div>
              <div className="mt-4 flex items-center justify-center"><div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-cyan/15 bg-cyan/5"><div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-700" /><motion.div className="absolute h-[85%] w-[85%] rounded-full border border-cyan/30" style={{ transform: 'rotateX(68deg)' }} animate={reduceMotion ? undefined : { rotate: 360 }} transition={reduceMotion ? undefined : { repeat: Infinity, duration: 10, ease: 'linear' }}><div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-cyan" /></motion.div></div></div>
            </Panel>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
