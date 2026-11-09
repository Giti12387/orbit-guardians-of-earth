import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { MainMenu } from './pages/MainMenu'
import { MissionControl } from './pages/MissionControl'
import { MissionBriefing } from './pages/MissionBriefing'
import { CoastalWatchMissionPage } from './pages/CoastalWatchMissionPage'
import { MissionResults } from './pages/MissionResults'
import { SolarSystem } from './pages/SolarSystem'
import { Spacecraft } from './pages/Spacecraft'
import { SatelliteOperations } from './pages/SatelliteOperations'
import { EarthGuardians } from './pages/EarthGuardians'
import { InvestigationBriefing } from './pages/InvestigationBriefing'
import { InvestigationMission } from './pages/InvestigationMission'
import { InvestigationResults } from './pages/InvestigationResults'
import { TechnologyLab } from './pages/TechnologyLab'
import { LearningCenter } from './pages/LearningCenter'
import { Settings } from './pages/Settings'
import { Credits } from './pages/Credits'
import { Achievements } from './pages/Achievements'
import { RocketFlight } from './pages/RocketFlight'

export default function App() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<MainMenu />} />
        <Route path="/credits" element={<Credits />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/mission-control" element={<MissionControl />} />
        <Route path="/explore" element={<SolarSystem />} />
        <Route path="/solar-system" element={<Navigate to="/explore" replace />} />
        <Route path="/spacecraft" element={<Spacecraft />} />
        <Route path="/play" element={<RocketFlight />} />
        <Route path="/satellite-operations" element={<SatelliteOperations />} />
        <Route path="/earth-guardians" element={<EarthGuardians />} />
        <Route path="/technology-lab" element={<TechnologyLab />} />
        <Route path="/learning" element={<LearningCenter />} />
        <Route path="/mission/coastal-watch/briefing" element={<MissionBriefing />} />
        <Route path="/mission/coastal-watch" element={<CoastalWatchMissionPage />} />
        <Route path="/mission/coastal-watch/results" element={<MissionResults />} />
        <Route path="/mission/:missionId/briefing" element={<InvestigationBriefing />} />
        <Route path="/mission/:missionId/results" element={<InvestigationResults />} />
        <Route path="/mission/:missionId" element={<InvestigationMission />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}
