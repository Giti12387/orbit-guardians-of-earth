import { PageShell } from '../components/layout/PageShell'
import { Panel, HudTag } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { useSettings } from '../lib/settings'
import { loadState, resetProgress, type SettingsState } from '../store/gameStore'
import { playUiTone } from '../lib/audio'

export function Settings() {
  const { settings, setSettings } = useSettings()
  const state = loadState()
  return (
    <PageShell backTo="/" backLabel="Main Menu" className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <Panel className="p-6">
          <div className="hud-label text-cyan">System Configuration</div>
          <h1 className="mt-2 font-[Space_Grotesk] text-3xl font-semibold">Settings</h1>
          <p className="mt-2 text-sm text-text-muted">Preferences are saved locally on this device. Audio effects are optional and respect browser interaction policies.</p>
        </Panel>

        <div className="grid gap-4 md:grid-cols-2">
          <Panel className="p-5">
            <div className="hud-label">Audio</div>
            <div className="mt-4 space-y-4 text-sm">
              <label className="flex items-center justify-between gap-3"><span>Sound effects (Web Audio tones)</span><input type="checkbox" checked={settings.soundEnabled} onChange={(e) => { setSettings({ soundEnabled: e.target.checked }); playUiTone({ ...settings, soundEnabled: true }, 'click') }} /></label>
              <div className="rounded-xl border border-white/8 bg-white/3 p-3 text-text-muted"><span className="font-semibold text-text">Background music:</span> unavailable in this build. Only optional UI sound effects are implemented; no audio is auto-played.</div>
              <label className="block"><div className="mb-1 flex justify-between text-text-muted"><span>Sound effect volume</span><span>{Math.round(settings.volume * 100)}%</span></div><input className="w-full" type="range" min={0} max={1} step={0.05} value={settings.volume} onChange={(e) => setSettings({ volume: Number(e.target.value) })} /></label>
              <Button onClick={() => playUiTone(settings, 'success')} disabled={!settings.soundEnabled}>Test Sound Effect</Button>
            </div>
          </Panel>
          <Panel className="p-5">
            <div className="hud-label">Graphics & Motion</div>
            <div className="mt-4 space-y-4 text-sm">
              <label className="block"><span className="text-text-muted">Graphics quality</span>
                <select className="mt-1 w-full rounded-xl border border-white/10 bg-bg/40 px-3 py-2" value={settings.graphicsQuality} onChange={(e) => setSettings({ graphicsQuality: e.target.value as SettingsState['graphicsQuality'] })}>
                  <option value="high">High</option><option value="balanced">Balanced</option><option value="low">Low (better performance)</option>
                </select>
              </label>
              <label className="flex items-center justify-between gap-3"><span>Reduced motion</span><input type="checkbox" checked={settings.reducedMotion} onChange={(e) => setSettings({ reducedMotion: e.target.checked })} /></label>
              <label className="flex items-center justify-between gap-3"><span>Show orbit paths</span><input type="checkbox" checked={settings.showOrbitPaths} onChange={(e) => setSettings({ showOrbitPaths: e.target.checked })} /></label>
              <div className="rounded-xl border border-white/8 bg-white/3 p-3 text-text-muted">Camera controls: drag to rotate, scroll/pinch to zoom in 3D views (where available). Touch and mouse supported.</div>
            </div>
          </Panel>
        </div>

        <Panel className="p-5">
          <div className="hud-label">Session</div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <HudTag tone="cyan">{state.profile.callsign}</HudTag>
            <HudTag>Level {state.profile.level}</HudTag>
            <HudTag tone="green">{state.profile.missionsCompleted} missions completed</HudTag>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})}>Toggle Fullscreen</Button>
            <Button variant="ghost" onClick={() => { if (confirm('Reset local progress and settings? This cannot be undone.')) { resetProgress(); window.location.href = '/' } }}>Reset Progress</Button>
          </div>
        </Panel>
      </div>
    </PageShell>
  )
}
