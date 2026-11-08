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
  firms: { name: 'NASA FIRMS (Fire Information for Resource Management System)', url: 'https://firms.modaps.eosdis.nasa.gov/' },
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

export function gibsPreviewUrl(layer = 'MODIS_Terra_CorrectedReflectance_TrueColor', date?: string) {
  // GIBS WMTS/tiles can be used in map contexts; this returns a documentation-friendly reference.
  const d = date || new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10)
  return { layer, date: d, url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${d}/GoogleMapsCompatible_Level9/4/8/5.jpg`, source: NASA_SOURCES.gibs.name }
}
