import type { SettingsState } from '../store/gameStore'

let ctx: AudioContext | null = null

function getCtx() {
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return null
  ctx = ctx || new Ctx()
  return ctx
}

export function playUiTone(settings: SettingsState, kind: 'click' | 'success' | 'alert' = 'click') {
  if (!settings.soundEnabled) return
  const ac = getCtx()
  if (!ac) return
  if (ac.state === 'suspended') void ac.resume().catch(() => {})
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  const freq = kind === 'success' ? 660 : kind === 'alert' ? 220 : 440
  osc.frequency.value = freq
  gain.gain.value = Math.max(0, Math.min(1, settings.volume)) * 0.03
  osc.connect(gain)
  gain.connect(ac.destination)
  const now = ac.currentTime
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
  osc.start(now)
  osc.stop(now + 0.13)
}
