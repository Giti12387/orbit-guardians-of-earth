export type SourceKind = 'real' | 'archived' | 'simulated'

export interface DataSourceRef {
  name: string
  date: string
  type: SourceKind
  url?: string
  note?: string
}

export const NASA_SOURCES = {
  gibs: { name: 'NASA GIBS (Global Imagery Browse Services)', url: 'https://gibs.earthdata.nasa.gov/' },
  power: { name: 'NASA POWER', url: 'https://power.larc.nasa.gov/' },
  firms: { name: 'NASA FIRMS', url: 'https://firms.modaps.eosdis.nasa.gov/' },
  eonet: { name: 'NASA EONET (Earth Observatory Natural Event Tracker)', url: 'https://eonet.gsfc.nasa.gov/' },
  earthObservatory: { name: 'NASA Earth Observatory', url: 'https://earthobservatory.nasa.gov/' },
}

export async function fetchEonetEvents(limit = 4, signal?: AbortSignal): Promise<{ ok: true; date: string; events: { id: string; title: string; categories: string[] }[] } | { ok: false; date: string; message: string }> {
  const date = new Date().toISOString().slice(0, 10)
  try {
    const res = await fetch(`https://eonet.gsfc.nasa.gov/api/v3/events?limit=${limit}&status=open`, { signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as any
    const events = (data?.events || []).map((e: any) => ({ id: String(e.id), title: String(e.title || 'Event'), categories: (e.categories || []).map((c: any) => String(c.title || c.id || '')) }))
    return { ok: true, date, events }
  } catch (e) {
    return { ok: false, date, message: e instanceof Error ? e.message : 'EONET request failed' }
  }
}

export async function fetchEonetStatus(signal?: AbortSignal): Promise<{ ok: boolean; count?: number; date: string; message: string }> {
  const r = await fetchEonetEvents(5, signal)
  if (r.ok) return { ok: true, count: r.events.length, date: r.date, message: 'NASA EONET responded successfully.' }
  return { ok: false, date: r.date, message: r.message }
}

export function recentGibsDate(daysAgo = 2) {
  return new Date(Date.now() - 86400000 * daysAgo).toISOString().slice(0, 10)
}

export function gibsWmsImageUrl(opts?: { layer?: string; date?: string; bbox?: string; width?: number; height?: number }) {
  const layer = opts?.layer || 'MODIS_Terra_CorrectedReflectance_TrueColor'
  const date = opts?.date || recentGibsDate(2)
  // WMS 1.3.0 + EPSG:4326 uses axis order lat,lon (miny,minx,maxy,maxx).
  const bbox = opts?.bbox || '-90,-180,90,180'
  const width = opts?.width || 1024
  const height = opts?.height || 512
  const params = new URLSearchParams({
    SERVICE: 'WMS',
    REQUEST: 'GetMap',
    VERSION: '1.3.0',
    LAYERS: layer,
    CRS: 'EPSG:4326',
    BBOX: bbox,
    WIDTH: String(width),
    HEIGHT: String(height),
    FORMAT: 'image/jpeg',
    TIME: date,
    TRANSPARENT: 'false',
  })
  return {
    layer,
    date,
    projection: 'EPSG:4326 (WMS 1.3.0 axis order: lat,lon)',
    url: `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?${params.toString()}`,
    source: NASA_SOURCES.gibs.name,
  }
}

export type PowerPoint = { date: string; value: number | null }
export type PowerSeries = { parameter: string; units: string; longname: string; points: PowerPoint[] }
export type PowerResult =
  | { ok: true; dateRange: string; coordinates: { lat: number; lon: number }; series: PowerSeries[]; source: string; url: string }
  | { ok: false; dateRange: string; coordinates: { lat: number; lon: number }; message: string; source: string }

export function validateLatLon(lat: number, lon: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return 'Latitude and longitude must be numbers.'
  if (lat < -90 || lat > 90) return 'Latitude must be between -90 and 90.'
  if (lon < -180 || lon > 180) return 'Longitude must be between -180 and 180.'
  return null
}

export function parsePowerResponse(data: any, parameters: string, dateRange: string, lat: number, lon: number): PowerResult {
  try {
    const paramData = data?.properties?.parameter || {}
    const paramMeta = data?.parameters || {}
    const series: PowerSeries[] = parameters.split(',').map((p) => {
      const values = paramData[p] || {}
      const points = Object.keys(values).sort().map((k) => {
        const iso = `${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6, 8)}`
        const raw = values[k]
        const v = typeof raw === 'number' ? raw : raw == null ? null : Number(raw)
        const missing = v == null || (typeof v === 'number' && v <= -999)
        return { date: iso, value: missing ? null : v }
      })
      return { parameter: p, units: paramMeta[p]?.units || '', longname: paramMeta[p]?.longname || p, points }
    })
    if (!series.some((s) => s.points.length)) throw new Error('No parameter data returned.')
    return { ok: true, dateRange, coordinates: { lat, lon }, series, source: NASA_SOURCES.power.name, url: '' }
  } catch (e) {
    return { ok: false, dateRange, coordinates: { lat, lon }, message: e instanceof Error ? e.message : 'POWER parse failed', source: NASA_SOURCES.power.name }
  }
}

export async function fetchPowerDaily(opts: { lat: number; lon: number; start?: string; end?: string; parameters?: string }, signal?: AbortSignal): Promise<PowerResult> {
  const end = opts.end || recentGibsDate(3)
  const start = opts.start || recentGibsDate(7)
  const dateRange = `${start} to ${end}`
  const err = validateLatLon(opts.lat, opts.lon)
  if (err) return { ok: false, dateRange, coordinates: { lat: opts.lat, lon: opts.lon }, message: err, source: NASA_SOURCES.power.name }
  const parameters = opts.parameters || 'T2M,PRECTOTCORR,RH2M'
  const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${encodeURIComponent(parameters)}&community=RE&longitude=${opts.lon}&latitude=${opts.lat}&start=${start.replace(/-/g, '')}&end=${end.replace(/-/g, '')}&format=JSON`
  try {
    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const parsed = parsePowerResponse(data, parameters, dateRange, opts.lat, opts.lon)
    return parsed.ok ? { ...parsed, url } : parsed
  } catch (e) {
    return { ok: false, dateRange, coordinates: { lat: opts.lat, lon: opts.lon }, message: e instanceof Error ? e.message : 'POWER request failed', source: NASA_SOURCES.power.name }
  }
}

export function parseFirmsCsv(text: string): FirmsRecord[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const header = (lines[0] || '').split(',')
  const idx = (n: string) => header.indexOf(n)
  return lines.slice(1).filter(Boolean).map((line) => {
    const cols = line.split(',')
    return {
      latitude: cols[idx('latitude')] ?? '',
      longitude: cols[idx('longitude')] ?? '',
      acq_date: cols[idx('acq_date')] ?? '',
      acq_time: cols[idx('acq_time')] ?? '',
      confidence: cols[idx('confidence')] ?? '',
      bright_ti4: cols[idx('bright_ti4')] ?? '',
      satellite: cols[idx('satellite')] ?? '',
      instrument: cols[idx('instrument')] ?? '',
    }
  }).filter((r) => r.latitude && r.longitude)
}

export function gibsBboxFromLatLon(lat: number, lon: number, delta = 10) {
  const minLat = Math.max(-90, lat - delta), maxLat = Math.min(90, lat + delta)
  const minLon = Math.max(-180, lon - delta), maxLon = Math.min(180, lon + delta)
  // WMS 1.3.0 EPSG:4326 axis order: minLat,minLon,maxLat,maxLon
  return `${minLat},${minLon},${maxLat},${maxLon}`
}

export type FirmsRecord = { latitude: string; longitude: string; acq_date: string; acq_time: string; confidence?: string; bright_ti4?: string; satellite?: string; instrument?: string }

export async function fetchFirmsArea(opts?: { area?: string; dayRange?: number }, signal?: AbortSignal): Promise<
  | { ok: true; date: string; count: number; records: FirmsRecord[]; source: string; note?: string }
  | { ok: false; blocked?: boolean; date: string; message: string; source: string }
> {
  const date = new Date().toISOString().slice(0, 10)
  const area = opts?.area || 'world'
  const dayRange = opts?.dayRange || 1
  try {
    const res = await fetch(`/api/firms?area=${encodeURIComponent(area)}&dayRange=${encodeURIComponent(String(dayRange))}`, { signal, headers: { accept: 'application/json' } })
    const data = await res.json().catch(() => ({})) as any
    if (res.status === 501 || data?.blocked) {
      return { ok: false, blocked: true, date, message: data?.message || 'Secure FIRMS proxy is not configured on this deployment. Live FIRMS requests are disabled; no live fire observations are fabricated.', source: NASA_SOURCES.firms.name }
    }
    if (!res.ok || !data?.ok) {
      return { ok: false, date, message: data?.message || `FIRMS proxy HTTP ${res.status}`, source: NASA_SOURCES.firms.name }
    }
    const records = Array.isArray(data.records) ? data.records as FirmsRecord[] : []
    return { ok: true, date: data.date || date, count: Number(data.count ?? records.length) || 0, records, source: NASA_SOURCES.firms.name, note: data.note }
  } catch (e) {
    return { ok: false, blocked: true, date, message: 'Secure FIRMS proxy unavailable in this environment. Live key-based requests are not exposed to the client; no live fire observations are fabricated.', source: NASA_SOURCES.firms.name }
  }
}
