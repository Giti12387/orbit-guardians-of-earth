import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { MainMenu } from './pages/MainMenu'
import { MissionControl } from './pages/MissionControl'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { MissionBriefing } from './pages/MissionBriefing'
import { CoastalWatchMissionPage } from './pages/CoastalWatchMissionPage'
import { MissionResults } from './pages/MissionResults'

export default function App() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<MainMenu />} />
        <Route path="/mission-control" element={<MissionControl />} />
        <Route path="/explore" element={<PlaceholderPage title="Explore Universe" subtitle="Solar system navigation is being prepared in this build. Your first Earth observation mission is fully operational." />} />
        <Route path="/solar-system" element={<Navigate to="/explore" replace />} />
        <Route path="/satellite-operations" element={<PlaceholderPage title="Satellite Operations" subtitle="Orbital operations console placeholder. Use Mission Control and the Coastal Watch mission for the active scientific workflow." />} />
        <Route path="/earth-guardians" element={<PlaceholderPage title="Earth Guardians" subtitle="Guardian initiatives hub placeholder. Start with Coastal Watch to see how satellite observations support environmental decisions." />} />
        <Route path="/technology-lab" element={<PlaceholderPage title="Technology Lab" subtitle="Research and upgrades placeholder. Complete missions to earn the research points that will power this lab." />} />
        <Route path="/learning" element={<PlaceholderPage title="Learning Center" subtitle="Learning modules placeholder. The Coastal Watch mission includes scientific context and a results report." />} />
        <Route path="/achievements" element={<PlaceholderPage title="Achievements" subtitle="Achievements placeholder. Mission progress is saved locally on this device." />} />
        <Route path="/settings" element={<PlaceholderPage title="Settings" subtitle="Settings placeholder. Motion is automatically reduced when your system prefers reduced motion." />} />
        <Route path="/mission/coastal-watch/briefing" element={<MissionBriefing />} />
        <Route path="/mission/coastal-watch" element={<CoastalWatchMissionPage />} />
        <Route path="/mission/coastal-watch/results" element={<MissionResults />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}
