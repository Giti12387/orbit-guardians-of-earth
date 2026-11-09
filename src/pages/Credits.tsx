import { PageShell } from '../components/layout/PageShell'
import { Panel } from '../components/ui/Panel'
import { NasaSourceBadge } from '../components/ui/NasaSourceBadge'

export function Credits() {
  return (
    <PageShell backTo="/" backLabel="Main Menu" className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <Panel className="p-6 sm:p-8">
          <div className="hud-label text-cyan">ORBIT: Guardians of Earth</div>
          <h1 className="mt-3 font-[Space_Grotesk] text-3xl font-semibold">Credits & Attribution</h1>
          <p className="mt-2 text-text-muted">Beyond Earth. Into the Unknown.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/8 bg-white/3 p-4 text-sm leading-7 text-text-muted">
              <div className="hud-label mb-2">Project</div>
              ORBIT is an educational space exploration and Earth observation experience designed for interactive learning. It combines game-like exploration with scientifically responsible explanations.
            </div>
            <div className="rounded-xl border border-white/8 bg-white/3 p-4 text-sm leading-7 text-text-muted">
              <div className="hud-label mb-2">Technology</div>
              Built with React, TypeScript, Vite, Tailwind CSS, Three.js, React Three Fiber, Drei, and Framer Motion.
            </div>
          </div>
          <div className="mt-6">
            <NasaSourceBadge
              sources={[
                { name: 'NASA GIBS', date: 'Referenced', type: 'archived', url: 'https://gibs.earthdata.nasa.gov/' },
                { name: 'NASA POWER', date: 'Referenced', type: 'archived', url: 'https://power.larc.nasa.gov/' },
                { name: 'NASA FIRMS', date: 'Referenced', type: 'archived', url: 'https://firms.modaps.eosdis.nasa.gov/' },
                { name: 'NASA EONET', date: 'Referenced', type: 'archived', url: 'https://eonet.gsfc.nasa.gov/' },
                { name: 'NASA Earth Observatory', date: 'Referenced', type: 'archived', url: 'https://earthobservatory.nasa.gov/' },
              ]}
            />
          </div>
          <p className="mt-5 text-sm leading-6 text-text-muted">ORBIT distinguishes real, archived, and simulated data. Training scenarios may use simulated values for reliability and clarity; they are never presented as live NASA observations.</p>
        </Panel>
      </div>
    </PageShell>
  )
}
