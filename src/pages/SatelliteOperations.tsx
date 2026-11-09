import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { PageShell } from '../components/layout/PageShell'
import { useSettings, prefersReducedMotion } from '../lib/settings'
import { Panel, HudTag } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/Progress'
import { NasaSourceBadge } from '../components/ui/NasaSourceBadge'
import { satelliteCatalog } from '../data/catalog'
import { fetchEonetStatus, fetchFirmsArea, fetchPowerDaily, gibsWmsImageUrl, NASA_SOURCES, recentGibsDate, type FirmsRecord, type PowerSeries } from '../lib/nasaData'

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
  const [power, setPower] = useState<{ state: 'idle' | 'loading' | 'ok' | 'error'; payload?: any; message?: string; series?: PowerSeries[]; dateRange?: string }>({ state: 'idle' })
  const [firms, setFirms] = useState<{ state: 'idle' | 'loading' | 'ok' | 'blocked' | 'error'; message?: string; count?: number; date?: string; records?: FirmsRecord[] }>({ state: 'idle' })
  const [captured, setCaptured] = useState<string[]>([])
  const sat = satelliteCatalog.find((s) => s.id === satId)! 
  const gibs = useMemo(() => gibsWmsImageUrl({ layer, date }), [layer, date])

  useEffect(() => {
    const ac = new AbortController()
    fetchEonetStatus(ac.signal).then((r) => setEonet(r.ok ? { state: 'ok', message: r.message, count: r.count, date: r.date } : { state: 'error', message: r.message, date: r.date })).catch(() => {})
    return () => ac.abort()
  }, [])

  useEffect(() => { setImgError(false) }, [gibs.url])

  const loadPower = async () => {
    setPower({ state: 'loading' })
    const la = Number(lat)
    const lo = Number(lon)
    if (!Number.isFinite(la) || !Number.isFinite(lo)) {
      setPower({ state: 'error', message: 'Enter valid numeric latitude and longitude.' })
      return
    }
    const r = await fetchPowerDaily({ lat: la, lon: lo })
    setPower(r.ok ? { state: 'ok', payload: r, series: r.series, dateRange: r.dateRange } : { state: 'error', message: r.message, payload: r, dateRange: r.dateRange })
  }

  const loadFirms = async () => {
    setFirms({ state: 'loading' })
    const r = await fetchFirmsArea({ area: 'world', dayRange: 1 })
    if (r.ok) setFirms({ state: 'ok', message: `FIRMS response received via secure proxy.`, count: r.count, date: r.date, records: r.records })
    else setFirms({ state: r.blocked ? 'blocked' : 'error', message: r.message, date: r.date })
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
              <p className="mt-2 text-sm text-text-muted">Fetch daily variables for a geographic coordinate. Values, units, and dates come from the POWER API response when successful.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <input className="rounded-xl border border-white/10 bg-bg/40 px-3 py-2 text-sm" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitude (-90 to 90)" />
                <input className="rounded-xl border border-white/10 bg-bg/40 px-3 py-2 text-sm" value={lon} onChange={(e) => setLon(e.target.value)} placeholder="Longitude (-180 to 180)" />
                <Button variant="primary" onClick={loadPower} disabled={power.state === 'loading'}>{power.state === 'loading' ? 'Loading...' : 'Fetch POWER'}</Button>
              </div>
              {power.state === 'ok' && power.series && (
                <div className="mt-3 space-y-3">
                  <div className="rounded-xl border border-success/25 bg-success/8 p-3 text-sm text-text-muted">
                    <div className="font-semibold text-success">NASA POWER response received (real API data)</div>
                    <div>Coordinates: {power.payload.coordinates.lat}, {power.payload.coordinates.lon} · Observation dates: {power.dateRange}</div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {power.series.map((s) => {
                      const valid = s.points.filter((p) => typeof p.value === 'number')
                      const latest = [...s.points].reverse().find((p) => typeof p.value === 'number')
                      return (
                        <div key={s.parameter} className="rounded-xl border border-white/8 bg-white/3 p-3">
                          <div className="hud-label">{s.parameter}</div>
                          <div className="mt-1 text-lg font-semibold text-text">{latest?.value != null ? `${latest.value} ${s.units}` : 'Missing'}</div>
                          <div className="text-xs text-text-muted">{s.longname} · Latest: {latest?.date || 'n/a'}</div>
                          <div className="mt-2 h-10">{valid.length > 1 && <svg viewBox="0 0 100 28" className="h-full w-full" preserveAspectRatio="none">{(() => { const vals = valid.map(p=>p.value as number); const min=Math.min(...vals); const max=Math.max(...vals); const span=max-min||1; const pts=vals.map((v,i)=>`${(i/(vals.length-1))*100},${27-((v-min)/span)*24}`).join(' '); return <polyline points={pts} fill="none" stroke="#00D9FF" strokeWidth="2" /> })()}</svg>}</div>
                          <div className="mt-1 text-[11px] text-text-muted">{s.points.some(p=>p.value==null) ? 'Some dates missing (-999/absent).' : 'No missing values in range.'}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              {power.state === 'error' && <div className="mt-3 rounded-xl border border-amber/25 bg-amber/8 p-3 text-sm text-text-muted"><div className="font-semibold text-amber">POWER unavailable</div><div>{power.message}. No fabricated values shown. Source attribution preserved.</div></div>}
              <div className="mt-3"><NasaSourceBadge sources={[{ name: NASA_SOURCES.power.name, date: power.dateRange || 'Requested on demand', type: power.state === 'ok' ? 'real' : 'archived', url: NASA_SOURCES.power.url, note: 'Daily point API (T2M, PRECTOTCORR, RH2M) with units from response' }]} /></div>
            </Panel>

            <Panel className="p-5">
              <div className="flex items-center justify-between gap-2"><div className="hud-label">NASA FIRMS Fire Observations</div><HudTag tone={firms.state === 'ok' ? 'green' : firms.state === 'blocked' ? 'amber' : 'cyan'}>{firms.state || 'idle'}</HudTag></div>
              <p className="mt-2 text-sm text-text-muted">Live FIRMS requests use a secure server/serverless proxy (`/api/firms`) with `FIRMS_MAP_KEY` stored server-side. The browser never receives the key. If no secure backend is configured, live requests are disabled and no fire observations are fabricated.</p>
              <div className="mt-3"><Button onClick={loadFirms} disabled={firms.state === 'loading'}>{firms.state === 'loading' ? 'Checking...' : 'Check FIRMS (Secure Proxy)'}</Button></div>
              {firms.message && <div className={`mt-3 rounded-xl border p-3 text-sm text-text-muted ${firms.state === 'ok' ? 'border-success/25 bg-success/8' : 'border-amber/25 bg-amber/8'}`}>{firms.state === 'ok' ? `FIRMS response received: ${firms.count} parsed record(s) (world, 1 day). ${firms.date}.` : firms.message}</div>}
              {firms.state === 'ok' && firms.records && firms.records.length > 0 && (
                <div className="mt-3 overflow-auto rounded-xl border border-white/8">
                  <table className="w-full text-left text-xs text-text-muted"><thead className="bg-white/5 text-text"><tr><th className="p-2">Lat</th><th className="p-2">Lon</th><th className="p-2">Date</th><th className="p-2">Time</th><th className="p-2">Confidence</th><th className="p-2">Satellite</th></tr></thead><tbody>{firms.records.slice(0,8).map((r,i)=>(<tr key={i} className="border-t border-white/5"><td className="p-2">{r.latitude}</td><td className="p-2">{r.longitude}</td><td className="p-2">{r.acq_date}</td><td className="p-2">{r.acq_time}</td><td className="p-2">{r.confidence || r.bright_ti4 || '—'}</td><td className="p-2">{r.satellite || r.instrument || '—'}</td></tr>))}</tbody></table>
                </div>
              )}
              <div className="mt-3"><NasaSourceBadge sources={[{ name: NASA_SOURCES.firms.name, date: firms.date || 'On demand', type: firms.state === 'ok' ? 'real' : 'archived', url: NASA_SOURCES.firms.url, note: firms.state === 'ok' ? 'VIIRS SNPP NRT via secure server proxy (parsed records)' : 'Live key-based requests disabled/unavailable in client; no fabricated observations' }]} /></div>
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
