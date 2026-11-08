export type MissionStatus = 'locked' | 'available' | 'completed'

export interface PlayerProfile {
  callsign: string
  rank: string
  level: number
  xp: number
  researchPoints: number
  missionsCompleted: number
  observations: number
}

export interface MissionProgress {
  id: string
  status: MissionStatus
  score?: number
  accuracy?: number
  completedAt?: string
}

export interface GameState {
  profile: PlayerProfile
  missions: Record<string, MissionProgress>
}

const STORAGE_KEY = 'orbit-guardians-state-v1'

export const defaultState: GameState = {
  profile: {
    callsign: 'Cadet Nova',
    rank: 'Observer Trainee',
    level: 1,
    xp: 0,
    researchPoints: 0,
    missionsCompleted: 0,
    observations: 0,
  },
  missions: {
    'coastal-watch': { id: 'coastal-watch', status: 'available' },
  },
}

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const parsed = JSON.parse(raw) as Partial<GameState>
    return {
      profile: { ...defaultState.profile, ...parsed.profile },
      missions: { ...defaultState.missions, ...parsed.missions },
    }
  } catch {
    return defaultState
  }
}

export function saveState(state: GameState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function completeMission(
  state: GameState,
  id: string,
  result: { score: number; accuracy: number; xp: number; research: number; observations: number },
): GameState {
  const prev = state.missions[id]
  const wasCompleted = prev?.status === 'completed'
  const next: GameState = {
    ...state,
    profile: {
      ...state.profile,
      xp: state.profile.xp + result.xp,
      researchPoints: state.profile.researchPoints + result.research,
      observations: state.profile.observations + result.observations,
      missionsCompleted: wasCompleted ? state.profile.missionsCompleted : state.profile.missionsCompleted + 1,
      level: 1 + Math.floor((state.profile.xp + result.xp) / 500),
      rank:
        state.profile.xp + result.xp >= 500
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
        completedAt: new Date().toISOString(),
      },
    },
  }
  saveState(next)
  return next
}
