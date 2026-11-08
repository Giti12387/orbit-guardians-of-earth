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

export async function fetchEonetStatus(signal?: AbortSignal): Promise<{ ok: boolean; count?: number; date: string; message: string }> {
  const date = new Date().toISOString().slice(0, 10)
  try {
    const res = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?limit=5&status=open', { signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as { events?: unknown[] }
    return { ok: true, count: data.events?.length ?? 0, date, message: 'NASA EONET responded successfully.' }
  } catch (e) {
    return { ok: false, date, message: e instanceof Error ? e.message : 'Network unavailable. Using demo data.' }
  }
}

export function recentGibsDate(daysAgo = 2) {
  return new Date(Date.now() - 86400000 * daysAgo).toISOString().slice(0, 10)
}

export function gibsWmsImageUrl(opts?: { layer?: string; date?: string; bbox?: string; width?: number; height?: number }) {
  const layer = opts?.layer || 'MODIS_Terra_CorrectedReflectance_TrueColor'
  const date = opts?.date || recentGibsDate(2)
  const bbox = opts?.bbox || '-180,-90,180,90'
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
    projection: 'EPSG:4326',
    url: `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?${params.toString()}`,
    source: NASA_SOURCES.gibs.name,
  }
}

export async function fetchPowerDaily(opts: { lat: number; lon: number; start?: string; end?: string; parameters?: string }, signal?: AbortSignal) {
  const end = opts.end || recentGibsDate(3)
  const start = opts.start || recentGibsDate(5)
  const parameters = opts.parameters || 'T2M,PRECTOTCORR,RH2M'
  const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${encodeURIComponent(parameters)}&community=RE&longitude=${opts.lon}&latitude=${opts.lat}&start=${start.replace(/-/g, '')}&end=${end.replace(/-/g, '')}&format=JSON`
  try {
    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return { ok: true as const, date: `${start} to ${end}`, data, parameters, coordinates: { lat: opts.lat, lon: opts.lon }, source: NASA_SOURCES.power.name, url }
  } catch (e) {
    return { ok: false as const, date: `${start} to ${end}`, message: e instanceof Error ? e.message : 'POWER request failed', parameters, coordinates: { lat: opts.lat, lon: opts.lon }, source: NASA_SOURCES.power.name }
  }
}

export function getFirmsConfig() {
  const key = (import.meta.env.VITE_FIRMS_MAP_KEY as string | undefined) || ''
  return { key, hasKey: !!key, source: NASA_SOURCES.firms.name, url: NASA_SOURCES.firms.url }
}

export async function fetchFirmsArea(opts?: { area?: string; dayRange?: number }, signal?: AbortSignal) {
  const { key, hasKey } = getFirmsConfig()
  const date = new Date().toISOString().slice(0, 10)
  if (!hasKey) {
    return { ok: false as const, type: 'blocked' as const, date, message: 'FIRMS MAP_KEY not configured. Set VITE_FIRMS_MAP_KEY for live fire observations; showing labeled demo/fallback context.', source: NASA_SOURCES.firms.name }
  }
  const area = opts?.area || 'world'
  const dayRange = opts?.dayRange || 1
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${encodeURIComponent(key)}/VIIRS_SNPP_NRT/${encodeURIComponent(area)}/${dayRange}`
  try {
    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    const lines = text.trim().split(/\r?\n/)
    const count = Math.max(0, lines.length - 1)
    return { ok: true as const, type: 'real' as const, date, count, message: 'FIRMS response received.', source: NASA_SOURCES.firms.name, note: 'VIIRS SNPP NRT area request' }
  } catch (e) {
    return { ok: false as const, type: 'error' as const, date, message: e instanceof Error ? e.message : 'FIRMS request failed', source: NASA_SOURCES.firms.name }
  }
}
