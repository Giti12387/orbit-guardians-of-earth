import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Fuel, Rocket, Sparkles, Star, Trophy } from 'lucide-react'
import { PageShell } from '../components/layout/PageShell'
import { Panel, HudTag } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/Progress'
import { loadState, saveState } from '../store/gameStore'

type Target = { id: string; name: string; x: number; y: number; r: number; color: string; info: string; points: number; hit?: boolean }
type StarDot = { x: number; y: number; s: number; a: number }

function makeTargets(w: number, h: number): Target[] {
  const items = [
    { id: 'sat', name: 'Orbital Satellite', color: '#00D9FF', info: 'Satellites observe Earth and relay data.', points: 20 },
    { id: 'moon', name: 'Moon Flyby', color: '#d6dde8', info: 'The Moon influences tides and preserves ancient history.', points: 30 },
    { id: 'mars', name: 'Mars Beacon', color: '#ff7a45', info: 'Mars missions search for clues about past environments.', points: 40 },
    { id: 'station', name: 'Research Station', color: '#46E58A', info: 'Space stations support science and technology testing.', points: 25 },
    { id: 'jupiter', name: 'Jupiter Signal', color: '#f2c078', info: 'Jupiter is a giant planet with many moons.', points: 45 },
    { id: 'nebula', name: 'Nebula Scan', color: '#825BFF', info: 'Nebulae are clouds of gas and dust in space.', points: 35 },
  ]
  return items.map((t, i) => ({ ...t, x: 90 + (i % 3) * ((w - 180) / 2) + (Math.random() * 60 - 30), y: h - 180 - i * 170 - Math.random() * 60, r: 18 + (i % 2) * 4 }))
}

export function RocketFlight() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [running, setRunning] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [fuel, setFuel] = useState(100)
  const [score, setScore] = useState(0)
  const [distance, setDistance] = useState(0)
  const [message, setMessage] = useState('Press Launch to start. Use Arrow Keys / WASD or touch controls to fly.')
  const [discovered, setDiscovered] = useState<string[]>([])
  const keys = useRef<Record<string, boolean>>({})
  const stateRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, fuel: 100, score: 0, distance: 0, camY: 0, targets: [] as Target[], stars: [] as StarDot[], running: false, awarded: false })

  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) e.preventDefault() }
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  const start = () => {
    const c = canvasRef.current, w = wrapRef.current
    if (!c || !w) return
    const rect = w.getBoundingClientRect()
    const width = Math.max(320, Math.floor(rect.width))
    const height = Math.max(420, Math.floor(rect.height))
    c.width = width; c.height = height
    stateRef.current = {
      x: width / 2, y: height - 80, vx: 0, vy: -1.2, fuel: 100, score: 0, distance: 0, camY: 0,
      targets: makeTargets(width, height),
      stars: Array.from({ length: 120 }, () => ({ x: Math.random() * width, y: Math.random() * height * 3, s: Math.random() * 2 + 0.5, a: Math.random() * 0.8 + 0.2 })),
      running: true, awarded: false,
    }
    setFuel(100); setScore(0); setDistance(0); setDiscovered([]); setGameOver(false); setRunning(true)
    setMessage('Flight active! Reach exploration targets and manage your fuel.')
  }

  useEffect(() => {
    if (!running) return
    let raf = 0
    const loop = () => {
      const c = canvasRef.current
      const ctx = c?.getContext('2d')
      const s = stateRef.current
      if (!c || !ctx || !s.running) return
      const k = keys.current
      const thrust = (k['arrowup'] || k['w']) && s.fuel > 0
      if (k['arrowleft'] || k['a']) s.vx -= 0.18
      if (k['arrowright'] || k['d']) s.vx += 0.18
      if (thrust) { s.vy -= 0.22; s.fuel = Math.max(0, s.fuel - 0.18) }
      s.vy += 0.04; // gravity/drag balance
      s.vx *= 0.985; s.vy *= 0.992
      s.vy = Math.max(-5.5, Math.min(4, s.vy))
      s.x += s.vx; s.y += s.vy
      s.x = Math.max(20, Math.min(c.width - 20, s.x))
      if (s.y < c.height * 0.35) s.camY += (c.height * 0.35 - s.y)
      s.distance = Math.max(s.distance, Math.floor(s.camY / 10))
      for (const t of s.targets) {
        if (t.hit) continue
        const ty = t.y + s.camY
        const dx = s.x - t.x, dy = s.y - ty
        if (dx * dx + dy * dy < (t.r + 16) * (t.r + 16)) {
          t.hit = true; s.score += t.points; s.fuel = Math.min(100, s.fuel + 12)
          setDiscovered((d) => d.includes(t.name) ? d : [...d, t.name])
          setMessage(`Explored: ${t.name} — ${t.info}`)
        }
      }
      if (s.y > c.height + 40 || (s.fuel <= 0 && s.vy > 1.5 && s.y > c.height - 60)) {
        s.running = false
        setRunning(false); setGameOver(true)
        setMessage(`Flight ended. Distance ${s.distance}, discoveries ${s.targets.filter(t=>t.hit).length}.`)
        if (!s.awarded) {
          s.awarded = true
          const gs = loadState()
          const gained = Math.max(10, Math.floor(s.score / 2) + Math.floor(s.distance / 8))
          saveState({ ...gs, profile: { ...gs.profile, discoveryPoints: gs.profile.discoveryPoints + gained, xp: gs.profile.xp + Math.floor(gained / 2) } })
        }
      }
      setFuel(s.fuel); setScore(s.score); setDistance(s.distance)

      ctx.clearRect(0, 0, c.width, c.height)
      const g = ctx.createLinearGradient(0, 0, 0, c.height)
      g.addColorStop(0, '#020611'); g.addColorStop(1, '#07162b')
      ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height)
      for (const st of s.stars) { const sy = (st.y + s.camY * 0.35) % (c.height * 1.2); ctx.fillStyle = `rgba(234,244,255,${st.a})`; ctx.fillRect(st.x, sy, st.s, st.s) }
      // Earth glow near start
      const earthY = c.height - 30 + s.camY
      if (earthY < c.height + 120) { const rg = ctx.createRadialGradient(c.width/2, earthY+120, 20, c.width/2, earthY+120, 220); rg.addColorStop(0,'rgba(23,107,255,0.35)'); rg.addColorStop(1,'rgba(23,107,255,0)'); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(c.width/2, earthY+120, 220, 0, Math.PI*2); ctx.fill() }
      for (const t of s.targets) {
        const ty = t.y + s.camY
        if (ty < -40 || ty > c.height + 40) continue
        ctx.beginPath(); ctx.arc(t.x, ty, t.r, 0, Math.PI * 2); ctx.fillStyle = t.hit ? 'rgba(70,229,138,0.25)' : t.color + '33'; ctx.fill()
        ctx.strokeStyle = t.hit ? '#46E58A' : t.color; ctx.lineWidth = 2; ctx.stroke()
        ctx.fillStyle = '#EAF4FF'; ctx.font = '12px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(t.hit ? 'Explored' : t.name, t.x, ty - t.r - 8)
      }
      // rocket
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(Math.max(-0.5, Math.min(0.5, s.vx * 0.08)))
      ctx.fillStyle = '#dfefff'; ctx.beginPath(); ctx.moveTo(0,-18); ctx.lineTo(10,12); ctx.lineTo(0,7); ctx.lineTo(-10,12); ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#176BFF'; ctx.fillRect(-10,8,6,8); ctx.fillRect(4,8,6,8)
      if (thrust) { ctx.fillStyle = '#FFB020'; ctx.beginPath(); ctx.moveTo(-4,12); ctx.lineTo(0,22+Math.random()*8); ctx.lineTo(4,12); ctx.closePath(); ctx.fill() }
      ctx.restore()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [running])

  const press = (k: string, v: boolean) => { keys.current[k] = v }
  const allFound = discovered.length >= 6

  return (
    <PageShell backTo="/mission-control" backLabel="Mission Control" className="px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <Panel className="p-5 flex flex-wrap items-center justify-between gap-3">
          <div><div className="hud-label text-cyan">Play Game</div><h1 className="font-[Space_Grotesk] text-3xl font-semibold">Rocket Flight Explorer</h1><p className="mt-1 text-sm text-text-muted">Take flight, steer your rocket, manage fuel, and explore space targets.</p></div>
          <div className="flex gap-2"><HudTag tone={running ? 'green' : 'amber'}>{running ? 'In Flight' : 'Ready'}</HudTag>{allFound && <HudTag tone="violet">All Explored</HudTag>}</div>
        </Panel>
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <Panel className="p-3 sm:p-4">
            <div ref={wrapRef} className="relative h-[60vh] min-h-[420px] w-full overflow-hidden rounded-2xl border border-cyan/15 bg-[#020611]">
              <canvas ref={canvasRef} className="h-full w-full" />
              {!running && (
                <div className="absolute inset-0 flex items-center justify-center bg-bg/45 p-4">
                  <Panel className="max-w-md p-5 text-center">
                    <Rocket className="mx-auto text-cyan" size={28} />
                    <h2 className="mt-3 font-[Space_Grotesk] text-2xl font-semibold">{gameOver ? 'Flight Complete' : 'Launch Rocket'}</h2>
                    <p className="mt-2 text-sm text-text-muted">Controls: <span className="text-text">Arrow keys / WASD</span> to steer and thrust. On mobile, use the touch controls. Reach targets to explore them and earn discovery points.</p>
                    <div className="mt-5 flex justify-center gap-3"><Button variant="primary" onClick={start}><Rocket size={16}/> {gameOver ? 'Play Again' : 'Launch'}</Button><Link to="/explore"><Button>Solar System</Button></Link></div>
                  </Panel>
                </div>
              )}
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 md:hidden">
              <div />
              <button type="button" className="rounded-xl border border-cyan/25 bg-cyan/10 p-3 text-cyan" onPointerDown={() => press('arrowup', true)} onPointerUp={() => press('arrowup', false)} onPointerLeave={() => press('arrowup', false)}><ArrowUp className="mx-auto" size={18}/></button>
              <div />
              <div className="row-start-2" />
              <button type="button" className="rounded-xl border border-white/10 bg-white/5 p-3 row-start-2" onPointerDown={() => press('arrowleft', true)} onPointerUp={() => press('arrowleft', false)} onPointerLeave={() => press('arrowleft', false)}><ArrowLeft className="mx-auto" size={18}/></button>
              <button type="button" className="rounded-xl border border-white/10 bg-white/5 p-3 row-start-2" onPointerDown={() => press('arrowdown', true)} onPointerUp={() => press('arrowdown', false)} onPointerLeave={() => press('arrowdown', false)}><ArrowDown className="mx-auto" size={18}/></button>
              <button type="button" className="rounded-xl border border-white/10 bg-white/5 p-3 row-start-2" onPointerDown={() => press('arrowright', true)} onPointerUp={() => press('arrowright', false)} onPointerLeave={() => press('arrowright', false)}><ArrowRight className="mx-auto" size={18}/></button>
            </div>
          </Panel>
          <div className="space-y-4">
            <Panel className="p-4">
              <div className="hud-label">Flight HUD</div>
              <div className="mt-3 space-y-3">
                <div><div className="mb-1 flex justify-between text-xs text-text-muted"><span className="flex items-center gap-1"><Fuel size={13}/> Fuel</span><span>{Math.round(fuel)}%</span></div><ProgressBar value={fuel} tone={fuel > 30 ? 'cyan' : 'amber'} /></div>
                <div className="grid grid-cols-2 gap-2"><div className="rounded-xl border border-white/8 bg-white/3 p-3"><div className="hud-label">Score</div><div className="mt-1 font-[Orbitron] text-cyan">{score}</div></div><div className="rounded-xl border border-white/8 bg-white/3 p-3"><div className="hud-label">Distance</div><div className="mt-1 font-[Orbitron] text-success">{distance}</div></div></div>
              </div>
              <div className="mt-3 rounded-xl border border-cyan/15 bg-cyan/5 p-3 text-sm text-text-muted">{message}</div>
            </Panel>
            <Panel className="p-4">
              <div className="hud-label">Explored Targets</div>
              <div className="mt-3 space-y-2">{['Orbital Satellite','Moon Flyby','Mars Beacon','Research Station','Jupiter Signal','Nebula Scan'].map(n => <div key={n} className={`flex items-center gap-2 rounded-lg border p-2 text-sm ${discovered.includes(n) ? 'border-success/25 bg-success/8 text-text' : 'border-white/8 bg-white/3 text-text-muted'}`}><Star size={14} className={discovered.includes(n)?'text-success':'text-text-muted'}/> {n}</div>)}</div>
            </Panel>
            <Panel className="p-4">
              <div className="hud-label">Rewards</div>
              <p className="mt-2 text-sm text-text-muted flex items-start gap-2"><Sparkles size={15} className="text-amber mt-0.5"/> Exploration earns discovery points and XP when the flight ends.</p>
              <Link to="/achievements" className="mt-3 block"><Button className="w-full"><Trophy size={15}/> Achievements</Button></Link>
            </Panel>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
