export async function handler(event) {
  const key = process.env.FIRMS_MAP_KEY
  if (!key) {
    return { statusCode: 501, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ok: false, blocked: true, message: 'Server FIRMS_MAP_KEY is not configured. Live FIRMS requests are disabled.' }) }
  }
  const area = event.queryStringParameters?.area || 'world'
  const dayRange = event.queryStringParameters?.dayRange || '1'
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${encodeURIComponent(key)}/VIIRS_SNPP_NRT/${encodeURIComponent(area)}/${encodeURIComponent(dayRange)}`
  try {
    const res = await fetch(url)
    if (!res.ok) return { statusCode: res.status, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ok: false, message: `FIRMS upstream HTTP ${res.status}` }) }
    const text = await res.text()
    const lines = text.trim().split(/\r?\n/)
    const header = (lines[0] || '').split(',')
    const idx = (n) => header.indexOf(n)
    const records = lines.slice(1).filter(Boolean).slice(0, 25).map((line) => {
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
    }).filter(r => r.latitude && r.longitude)
    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ok: true, date: new Date().toISOString().slice(0,10), count: records.length, records, source: 'NASA FIRMS', note: 'VIIRS SNPP NRT area request via secure server proxy' }) }
  } catch (e) {
    return { statusCode: 502, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ok: false, message: e instanceof Error ? e.message : 'FIRMS proxy failed' }) }
  }
}
