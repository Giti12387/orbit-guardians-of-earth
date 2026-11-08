import { describe, expect, it } from 'vitest'
import { gibsBboxFromLatLon, gibsWmsImageUrl, parseFirmsCsv, parsePowerResponse, validateLatLon } from './nasaData'

describe('nasaData helpers', () => {
  it('builds GIBS WMS 1.3.0 EPSG:4326 bbox in lat,lon axis order', () => {
    const g = gibsWmsImageUrl({ date: '2026-05-01' })
    expect(g.url).toContain('VERSION=1.3.0')
    expect(g.url).toContain('CRS=EPSG%3A4326')
    expect(g.url).toContain('BBOX=-90%2C-180%2C90%2C180')
    expect(g.projection).toContain('lat,lon')
  })

  it('creates local bbox in lat,lon order', () => {
    expect(gibsBboxFromLatLon(10, 20, 5)).toBe('5,15,15,25')
  })

  it('validates latitude and longitude', () => {
    expect(validateLatLon(14.6, 120.98)).toBeNull()
    expect(validateLatLon(91, 0)).toContain('Latitude')
    expect(validateLatLon(0, 181)).toContain('Longitude')
    expect(validateLatLon(Number.NaN, 0)).toContain('numbers')
  })

  it('parses NASA POWER response with units and missing values', () => {
    const data = {
      properties: { parameter: { T2M: { '20260501': 28.3, '20260502': -999 }, RH2M: { '20260501': 70.1 } } },
      parameters: { T2M: { units: 'C', longname: 'Temperature at 2 Meters' }, RH2M: { units: '%' } },
    }
    const r = parsePowerResponse(data, 'T2M,RH2M', '2026-05-01 to 2026-05-02', 14.6, 120.98)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.series.find(s => s.parameter === 'T2M')?.units).toBe('C')
    expect(r.series.find(s => s.parameter === 'T2M')?.points[1].value).toBeNull()
    expect(r.series.find(s => s.parameter === 'RH2M')?.points[0].value).toBe(70.1)
  })

  it('handles POWER parse failures', () => {
    const r = parsePowerResponse({}, 'T2M', 'x', 0, 0)
    expect(r.ok).toBe(false)
  })

  it('parses FIRMS CSV records and ignores empty rows', () => {
    const csv = 'latitude,longitude,acq_date,acq_time,confidence,satellite\n14.1,121.2,2026-05-01,0130,n,NOAA-20\n'
    const rows = parseFirmsCsv(csv)
    expect(rows).toHaveLength(1)
    expect(rows[0].latitude).toBe('14.1')
    expect(rows[0].acq_date).toBe('2026-05-01')
    expect(rows[0].confidence).toBe('n')
  })

  it('returns empty FIRMS records for invalid CSV', () => {
    expect(parseFirmsCsv('')).toEqual([])
  })
})
