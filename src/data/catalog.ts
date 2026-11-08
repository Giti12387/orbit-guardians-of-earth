export interface BodyInfo {
  id: string
  name: string
  type: string
  color: string
  radius: number
  orbit: number
  speed: number
  facts: string[]
  science: string
}

export const solarBodies: BodyInfo[] = [
  { id: 'sun', name: 'Sun', type: 'Star', color: '#ffcc55', radius: 2.2, orbit: 0, speed: 0, facts: ['The Sun contains most of the mass in the Solar System.', 'Its energy drives weather, climate, and life on Earth.'], science: 'The Sun is a G-type main-sequence star. Solar radiation and space weather affect satellites and communications.' },
  { id: 'mercury', name: 'Mercury', type: 'Terrestrial planet', color: '#9b9b9b', radius: 0.28, orbit: 3.2, speed: 0.9, facts: ['Smallest planet and closest to the Sun.', 'Has extreme temperature changes.'], science: 'Mercury has a thin exosphere and a heavily cratered surface, helping scientists study early Solar System history.' },
  { id: 'venus', name: 'Venus', type: 'Terrestrial planet', color: '#e7b96a', radius: 0.52, orbit: 4.2, speed: 0.7, facts: ['Similar in size to Earth.', 'Thick atmosphere creates intense greenhouse warming.'], science: 'Venus demonstrates how greenhouse gases can strongly affect planetary temperature.' },
  { id: 'earth', name: 'Earth', type: 'Terrestrial planet', color: '#2e86ff', radius: 0.55, orbit: 5.3, speed: 0.55, facts: ['Only known planet to support life.', 'Has oceans, atmosphere, and active climate systems.'], science: 'Earth observation satellites monitor weather, vegetation, oceans, fires, and environmental change.' },
  { id: 'moon', name: 'Moon', type: 'Natural satellite', color: '#cfcfcf', radius: 0.18, orbit: 0.95, speed: 1.4, facts: ['Earth’s only natural satellite.', 'Influences tides on Earth.'], science: 'The Moon preserves impact records and is a key destination for future exploration and science.' },
  { id: 'mars', name: 'Mars', type: 'Terrestrial planet', color: '#d96b43', radius: 0.42, orbit: 6.5, speed: 0.46, facts: ['Known as the Red Planet.', 'Has polar ice and evidence of ancient water activity.'], science: 'Mars missions study geology and past environments to understand planetary evolution and habitability.' },
  { id: 'jupiter', name: 'Jupiter', type: 'Gas giant', color: '#d8b08c', radius: 1.1, orbit: 8.4, speed: 0.28, facts: ['Largest planet in the Solar System.', 'Has a strong magnetic field and many moons.'], science: 'Jupiter’s atmosphere and moons provide clues about giant planet formation and diverse worlds.' },
  { id: 'saturn', name: 'Saturn', type: 'Gas giant', color: '#e2c989', radius: 0.95, orbit: 10.2, speed: 0.22, facts: ['Famous for its ring system.', 'A gas giant with many moons.'], science: 'Saturn’s rings and moons help scientists study orbital dynamics and icy worlds.' },
  { id: 'uranus', name: 'Uranus', type: 'Ice giant', color: '#8fd7e6', radius: 0.72, orbit: 12.0, speed: 0.16, facts: ['Rotates on a strongly tilted axis.', 'An ice giant with a cold atmosphere.'], science: 'Uranus challenges models of planet formation because of its extreme axial tilt.' },
  { id: 'neptune', name: 'Neptune', type: 'Ice giant', color: '#3f6fe0', radius: 0.7, orbit: 13.6, speed: 0.13, facts: ['Farthest major planet from the Sun.', 'Known for strong winds.'], science: 'Neptune’s atmosphere and interior help scientists understand ice giants and distant planetary systems.' },
]

export const spacecraftCatalog = [
  { id: 'aurora', name: 'Aurora Surveyor', role: 'Earth observation and training', speed: 'Medium', range: 'High', status: 'Ready', notes: 'Balanced spacecraft for science missions and orbital surveys.' },
  { id: 'helios', name: 'Helios Courier', role: 'Rapid transfer', speed: 'High', range: 'Medium', status: 'Ready', notes: 'Fast response craft for time-sensitive observations.' },
  { id: 'atlas', name: 'Atlas Researcher', role: 'Deep analysis', speed: 'Medium', range: 'Very High', status: 'Maintenance check complete', notes: 'Optimized for long-duration scientific exploration.' },
]

export const satelliteCatalog = [
  { id: 'terrawatch', name: 'TerraWatch-1', orbit: 'Sun-synchronous LEO', status: 'Operational', focus: 'Land, coastlines, vegetation', instruments: ['Multispectral imager', 'Thermal sensor'] },
  { id: 'oceanscan', name: 'OceanScan-A', orbit: 'LEO', status: 'Operational', focus: 'Ocean and coastal conditions', instruments: ['Ocean color sensor', 'Radar altimeter (simulated status)'] },
  { id: 'skysentry', name: 'SkySentry', orbit: 'Geostationary (concept)', status: 'Monitoring', focus: 'Storms and broad weather patterns', instruments: ['Cloud imager', 'Lightning mapper (concept)'] },
]

export const achievementsCatalog = [
  { id: 'first-orbit', name: 'First Orbit', desc: 'Complete your first mission.' },
  { id: 'perfect-scan', name: 'Perfect Scan', desc: 'Finish a mission with 100% accuracy.' },
  { id: 'earth-guardian', name: 'Earth Guardian', desc: 'Complete 5 missions.' },
  { id: 'solar-explorer', name: 'Solar Explorer', desc: 'Visit all major Solar System bodies in the explorer.' },
  { id: 'launch-commander', name: 'Launch Commander', desc: 'Complete a spacecraft launch sequence.' },
]
