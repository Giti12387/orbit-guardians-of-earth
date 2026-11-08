import { Component, type ReactNode } from 'react'
import { Panel } from './ui/Panel'
import { Button } from './ui/Button'

export class ErrorBoundary extends Component<{ children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {}
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-bg p-6 text-text">
          <div className="mx-auto max-w-2xl">
            <Panel className="p-6">
              <div className="hud-label text-amber">System Notice</div>
              <h1 className="mt-3 font-[Space_Grotesk] text-2xl font-semibold">A module encountered an error</h1>
              <p className="mt-3 text-sm leading-6 text-text-muted">ORBIT recovered the interface. You can return to Mission Control and continue.</p>
              <pre className="mt-4 overflow-auto rounded-xl bg-black/30 p-3 text-xs text-text-muted">{this.state.error.message}</pre>
              <div className="mt-5 flex gap-3">
                <Button variant="primary" onClick={() => (window.location.href = '/mission-control')}>Mission Control</Button>
                <Button onClick={() => window.location.reload()}>Reload</Button>
              </div>
            </Panel>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
