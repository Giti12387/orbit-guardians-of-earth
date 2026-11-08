export type MissionStatus = 'locked' | 'available' | 'completed'

export interface PlayerProfile {
  callsign: string
  rank: string
  level: number
  xp: number
  researchPoints: number
  discoveryPoints: number
  missionsCompleted: number
  observations: number
  spacecraft: string
  activeSatellite: string
}

export interface MissionProgress {
  id: string
  status: MissionStatus
  score?: number
  accuracy?: number
  completedAt?: string
  reportId?: string
}

export interface MissionReport {
  id: string
  completionId?: string
  missionId: string
  missionName: string
  completedAt: string
  objectivesCompleted: number
  objectivesTotal: number
  observationsCollected: number
  findings: string[]
  score: number
  accuracy: number
  rewards: { xp: number; research: number; discovery: number }
  sources: { name: string; date: string; type: 'real' | 'archived' | 'simulated'; url?: string; note?: string }[]
  summary: string
  detail?: Record<string, unknown>
}

export interface SettingsState {
  soundEnabled: boolean
  musicEnabled: boolean
  volume: number
  graphicsQuality: 'high' | 'balanced' | 'low'
  reducedMotion: boolean
  showOrbitPaths: boolean
}

export interface GameState {
  version: number
  profile: PlayerProfile
  missions: Record<string, MissionProgress>
  reports: MissionReport[]
  achievements: string[]
  discoveries: string[]
  settings: SettingsState
  lastMissionId?: string
}

export const STORAGE_KEY = 'orbit-guardians-state-v2'
const LEGACY_KEY = 'orbit-guardians-state-v1'

export const allMissionIds = [
  'coastal-watch',
  'heatwave-watch',
  'forest-change',
  'wildfire-response',
  'ocean-conditions',
  'storm-tracker',
  'drought-signals',
  'environmental-monitoring',
] as const

export const defaultState: GameState = {
  version: 2,
  profile: {
    callsign: 'Cadet Nova',
    rank: 'Observer Trainee',
    level: 1,
    xp: 0,
    researchPoints: 0,
    discoveryPoints: 0,
    missionsCompleted: 0,
    observations: 0,
    spacecraft: 'Aurora Surveyor',
    activeSatellite: 'TerraWatch-1',
  },
  missions: Object.fromEntries(
    allMissionIds.map((id) => [id, { id, status: id === 'coastal-watch' ? 'available' : 'available' }]),
  ),
  reports: [],
  achievements: [],
  discoveries: [],
  settings: {
    soundEnabled: false,
    musicEnabled: false,
    volume: 0.5,
    graphicsQuality: 'balanced',
    reducedMotion: false,
    showOrbitPaths: true,
  },
}

function mergeState(base: GameState, parsed: Partial<GameState>): GameState {
  return {
    ...base,
    ...parsed,
    profile: { ...base.profile, ...parsed.profile },
    missions: { ...base.missions, ...(parsed.missions || {}) },
    reports: Array.isArray(parsed.reports) ? parsed.reports : base.reports,
    achievements: Array.isArray(parsed.achievements) ? parsed.achievements : base.achievements,
    discoveries: Array.isArray(parsed.discoveries) ? parsed.discoveries : base.discoveries,
    settings: { ...base.settings, ...parsed.settings },
  }
}

export function loadState(): GameState {
  if (typeof localStorage === 'undefined') return defaultState
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY)
    if (!raw) return defaultState
    const parsed = JSON.parse(raw) as Partial<GameState>
    return mergeState(defaultState, parsed)
  } catch {
    return defaultState
  }
}

export function saveState(state: GameState) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function updateSettings(patch: Partial<SettingsState>): GameState {
  const state = loadState()
  const next = { ...state, settings: { ...state.settings, ...patch } }
  saveState(next)
  return next
}

export function unlockAchievement(state: GameState, id: string): GameState {
  if (state.achievements.includes(id)) return state
  const next = { ...state, achievements: [...state.achievements, id] }
  saveState(next)
  return next
}

export function getReportByCompletionId(state: GameState, completionId: string) {
  return state.reports.find((r) => r.completionId === completionId)
}

export function getLatestMissionReport(state: GameState, missionId: string) {
  return state.reports.find((r) => r.missionId === missionId)
}

export function completeMission(
  id: string,
  result: {
    completionId?: string
    score: number
    accuracy: number
    xp: number
    research: number
    discovery?: number
    observations: number
    missionName: string
    objectivesCompleted: number
    objectivesTotal: number
    findings: string[]
    summary: string
    sources: { name: string; date: string; type: 'real' | 'archived' | 'simulated'; url?: string; note?: string }[]
    detail?: Record<string, unknown>
  },
): { state: GameState; report: MissionReport; awarded: boolean } {
  const state = loadState()
  if (result.completionId) {
    const existing = getReportByCompletionId(state, result.completionId)
    if (existing) return { state, report: existing, awarded: false }
  }
  const prev = state.missions[id]
  const wasCompleted = prev?.status === 'completed'
  const discovery = result.discovery ?? Math.max(10, Math.round(result.score / 20))
  const report: MissionReport = {
    id: `${id}-${Date.now()}`,
    completionId: result.completionId,
    missionId: id,
    missionName: result.missionName,
    completedAt: new Date().toISOString(),
    objectivesCompleted: result.objectivesCompleted,
    objectivesTotal: result.objectivesTotal,
    observationsCollected: result.observations,
    findings: result.findings,
    score: result.score,
    accuracy: result.accuracy,
    rewards: { xp: result.xp, research: result.research, discovery },
    sources: result.sources,
    summary: result.summary,
    detail: result.detail,
  }
  let next: GameState = {
    ...state,
    profile: {
      ...state.profile,
      xp: state.profile.xp + result.xp,
      researchPoints: state.profile.researchPoints + result.research,
      discoveryPoints: state.profile.discoveryPoints + discovery,
      observations: state.profile.observations + result.observations,
      missionsCompleted: wasCompleted ? state.profile.missionsCompleted : state.profile.missionsCompleted + 1,
      level: 1 + Math.floor((state.profile.xp + result.xp) / 500),
      rank:
        state.profile.xp + result.xp >= 1500
          ? 'Mission Specialist'
          : state.profile.xp + result.xp >= 500
            ? 'Earth Observer'
            : state.profile.rank,
    },
    missions: {
      ...state.missions,
      [id]: {
        id,
        status: 'completed',
        score: Math.max(prev?.score ?? 0, result.score),
        accuracy: Math.max(prev?.accuracy ?? 0, result.accuracy),
        completedAt: report.completedAt,
        reportId: report.id,
      },
    },
    reports: [report, ...state.reports].slice(0, 30),
    lastMissionId: id,
  }
  const ach = new Set(next.achievements)
  if (next.profile.missionsCompleted >= 1) ach.add('first-orbit')
  if (result.accuracy >= 100) ach.add('perfect-scan')
  if (next.profile.missionsCompleted >= 5) ach.add('earth-guardian')
  next = { ...next, achievements: [...ach] }
  saveState(next)
  return { state: next, report, awarded: true }
}

export function resetProgress() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(LEGACY_KEY)
}
