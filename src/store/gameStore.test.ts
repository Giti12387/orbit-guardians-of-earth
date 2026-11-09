import { beforeEach, describe, expect, it, vi } from 'vitest'

function createMemoryStorage() {
  const store = new Map<string, string>()
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => void store.clear(),
  }
}

describe('gameStore', () => {
  beforeEach(() => {
    vi.resetModules()
    Object.defineProperty(globalThis, 'localStorage', { value: createMemoryStorage(), configurable: true, writable: true })
  })

  const payload = (over: Record<string, unknown> = {}) => ({
    score: 800,
    accuracy: 100,
    xp: 220,
    research: 80,
    discovery: 90,
    observations: 3,
    missionName: 'Test Mission',
    objectivesCompleted: 3,
    objectivesTotal: 3,
    findings: ['Finding'],
    summary: 'Summary',
    sources: [{ name: 'NASA EONET', date: '2026-01-01', type: 'archived' as const }],
    ...over,
  })

  it('awards XP, research, discovery, observations and saves progress', async () => {
    const mod = await import('./gameStore')
    mod.resetProgress()
    const res = mod.completeMission('coastal-watch', payload({ completionId: 'c1' }))
    expect(res.awarded).toBe(true)
    expect(res.state.profile.xp).toBe(220)
    expect(res.state.profile.researchPoints).toBe(80)
    expect(res.state.profile.discoveryPoints).toBe(90)
    expect(res.state.profile.observations).toBe(3)
    expect(res.state.missions['coastal-watch'].status).toBe('completed')
    const loaded = mod.loadState()
    expect(loaded.profile.xp).toBe(220)
    expect(loaded.reports[0].missionId).toBe('coastal-watch')
  })

  it('calculates level and rank from XP', async () => {
    const mod = await import('./gameStore')
    mod.resetProgress()
    mod.completeMission('coastal-watch', payload({ completionId: 'c1', xp: 600 }))
    const s = mod.loadState()
    expect(s.profile.level).toBe(2)
    expect(s.profile.rank).toBe('Earth Observer')
  })

  it('unlocks achievements', async () => {
    const mod = await import('./gameStore')
    mod.resetProgress()
    mod.completeMission('coastal-watch', payload({ completionId: 'c1', accuracy: 100 }))
    const s = mod.loadState()
    expect(s.achievements).toContain('first-orbit')
    expect(s.achievements).toContain('perfect-scan')
  })

  it('prevents duplicate rewards for the same completionId (refresh/revisit)', async () => {
    const mod = await import('./gameStore')
    mod.resetProgress()
    mod.completeMission('coastal-watch', payload({ completionId: 'same-id' }))
    const again = mod.completeMission('coastal-watch', payload({ completionId: 'same-id' }))
    expect(again.awarded).toBe(false)
    const s = mod.loadState()
    expect(s.profile.xp).toBe(220)
    expect(s.reports.length).toBe(1)
  })

  it('persists mission result report for reopening saved report', async () => {
    const mod = await import('./gameStore')
    mod.resetProgress()
    mod.completeMission('heatwave-watch', payload({ completionId: 'h1', missionName: 'Heatwave Watch', detail: { correct: true } }))
    const s = mod.loadState()
    const report = mod.getLatestMissionReport(s, 'heatwave-watch')
    expect(report?.missionName).toBe('Heatwave Watch')
    expect(report?.detail).toEqual({ correct: true })
  })
})
