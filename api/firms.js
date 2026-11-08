export default async function handler(req, res) {
  const key = process.env.FIRMS_MAP_KEY
  if (!key) return res.status(501).json({ ok: false, blocked: true, message: 'Server FIRMS_MAP_KEY is not configured. Live FIRMS requests are disabled.' })
  const area = req.query?.area || 'world'
  const dayRange = req.query?.dayRange || '1'
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${encodeURIComponent(key)}/VIIRS_SNPP_NRT/${encodeURIComponent(String(area))}/${encodeURIComponent(String(dayRange))}`
  try {
    const r = await fetch(url)
    if (!r.ok) return res.status(r.status).json({ ok: false, message: `FIRMS upstream HTTP ${r.status}` })
    const text = await r.text()
    const lines = text.trim().split(/\r?\n/)
    const header = (lines[0] || '').split(',')
    const idx = (n) => header.indexOf(n)
    const records = lines.slice(1).filter(Boolean).slice(0, 25).map((line) => {
      const cols = line.split(',')
      return { latitude: cols[idx('latitude')] ?? '', longitude: cols[idx('longitude')] ?? '', acq_date: cols[idx('acq_date')] ?? '', acq_time: cols[idx('acq_time')] ?? '', confidence: cols[idx('confidence')] ?? '', bright_ti4: cols[idx('bright_ti4')] ?? '', satellite: cols[idx('satellite')] ?? '', instrument: cols[idx('instrument')] ?? '' }
    }).filter(r => r.latitude && r.longitude)
    return res.status(200).json({ ok: true, date: new Date().toISOString().slice(0,10), count: records.length, records, source: 'NASA FIRMS', note: 'VIIRS SNPP NRT area request via secure server proxy' })
  } catch (e) {
    return res.status(502).json({ ok: false, message: e instanceof Error ? e.message : 'FIRMS proxy failed' })
  }
}
