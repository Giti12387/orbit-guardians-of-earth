import { Link } from 'react-router-dom'
import { Rocket } from 'lucide-react'
import { PageShell } from '../components/layout/PageShell'
import { Panel } from '../components/ui/Panel'
import { Button } from '../components/ui/Button'

export function PlaceholderPage({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <PageShell backTo="/" backLabel="Main Menu" className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Panel className="p-6 sm:p-8">
          <div className="hud-label text-cyan">ORBIT System Module</div>
          <h1 className="mt-3 font-[Space_Grotesk] text-3xl font-semibold text-text sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-text-muted">{subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/mission/coastal-watch/briefing">
              <Button variant="primary">
                <Rocket size={16} /> Start Coastal Watch
              </Button>
            </Link>
            <Link to="/mission-control">
              <Button>Open Mission Control</Button>
            </Link>
          </div>
        </Panel>
      </div>
    </PageShell>
  )
}
