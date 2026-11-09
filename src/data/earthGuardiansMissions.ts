export interface EvidenceItem {
  id: string
  label: string
  value: string
  source: string
  sourceType: 'real' | 'archived' | 'simulated'
  date: string
}

export interface InvestigationMission {
  id: string
  title: string
  topic: string
  accent: string
  location: string
  briefing: string
  objectives: string[]
  evidence: EvidenceItem[]
  question: string
  options: { id: string; label: string; correct: boolean; why: string }[]
  findings: string[]
  sources: { name: string; date: string; type: 'real' | 'archived' | 'simulated'; url?: string; note?: string }[]
}

const today = new Date().toISOString().slice(0, 10)

export const investigationMissions: InvestigationMission[] = [
  {
    id: 'heatwave-watch',
    title: 'Heatwave Watch',
    topic: 'Heatwaves',
    accent: '#FFB020',
    location: 'Urban valley region (training scenario)',
    briefing: 'Investigate rising heat risk by comparing temperature, vegetation, and surface conditions.',
    objectives: ['Review temperature and surface evidence.', 'Compare environmental factors.', 'Identify the primary issue and submit a report.'],
    evidence: [
      { id: 't', label: 'Daytime temperature anomaly', value: '+4.2°C above local baseline (7-day average)', source: 'NASA POWER climate-style reference (demo/training context)', sourceType: 'simulated', date: today },
      { id: 'v', label: 'Vegetation cover', value: 'Low tree canopy in dense neighborhoods', source: 'Land-cover training dataset', sourceType: 'simulated', date: today },
      { id: 'n', label: 'Night cooling', value: 'Limited overnight cooling after sunset', source: 'Thermal pattern simulation', sourceType: 'simulated', date: today },
    ],
    question: 'Based on the evidence, what is the main environmental issue?',
    options: [
      { id: 'a', label: 'Heatwave amplified by urban heat island conditions', correct: true, why: 'High anomalies, low canopy, and poor night cooling indicate dangerous heat stress.' },
      { id: 'b', label: 'Coastal flooding from storm surge', correct: false, why: 'Evidence shows heat and surface patterns, not flooding.' },
      { id: 'c', label: 'Improved vegetation health', correct: false, why: 'Vegetation cover is low, which can worsen heat.' },
    ],
    findings: ['Heat risk increases when high temperatures combine with built surfaces and limited vegetation.', 'Nighttime cooling is important for public health during heatwaves.'],
    sources: [
      { name: 'NASA POWER', date: today, type: 'simulated', url: 'https://power.larc.nasa.gov/', note: 'Demo values inspired by meteorological concepts' },
      { name: 'NASA Earth Observatory - heat and urban climate topics', date: today, type: 'archived', url: 'https://earthobservatory.nasa.gov/' },
    ],
  },
  {
    id: 'forest-change',
    title: 'Forest Change Survey',
    topic: 'Forest changes',
    accent: '#46E58A',
    location: 'Tropical forest edge (training scenario)',
    briefing: 'Compare vegetation signals and land-use indicators to assess forest change.',
    objectives: ['Inspect vegetation and canopy evidence.', 'Identify likely drivers.', 'Submit an evidence-based conclusion.'],
    evidence: [
      { id: 'ndvi', label: 'Vegetation index trend', value: 'Declining greenness over recent comparison periods', source: 'Satellite vegetation training index', sourceType: 'simulated', date: today },
      { id: 'clear', label: 'Canopy pattern', value: 'Patchy clearings near access roads', source: 'True-color interpretation (training)', sourceType: 'simulated', date: today },
      { id: 'rain', label: 'Rainfall context', value: 'Near-normal seasonal rainfall', source: 'NASA POWER-style context (demo)', sourceType: 'simulated', date: today },
    ],
    question: 'What best explains the observed forest change?',
    options: [
      { id: 'a', label: 'Likely land-cover disturbance/deforestation pressure', correct: true, why: 'Declining greenness and patchy clearings with near-normal rainfall suggest disturbance rather than drought alone.' },
      { id: 'b', label: 'Normal seasonal leaf growth only', correct: false, why: 'The pattern shows decline and clearings.' },
      { id: 'c', label: 'Ocean salinity increase', correct: false, why: 'Not related to this forest evidence.' },
    ],
    findings: ['Vegetation indices and imagery help monitor forest health.', 'Comparing rainfall context helps separate climate stress from land-use change.'],
    sources: [
      { name: 'NASA Earth Observatory - forests/land cover', date: today, type: 'archived', url: 'https://earthobservatory.nasa.gov/' },
      { name: 'ORBIT training evidence set', date: today, type: 'simulated' },
    ],
  },
  {
    id: 'wildfire-response',
    title: 'Wildfire Response',
    topic: 'Wildfires',
    accent: '#FFB020',
    location: 'Dry woodland interface (training scenario)',
    briefing: 'Use thermal, smoke, and weather evidence to assess active wildfire risk.',
    objectives: ['Review fire and weather evidence.', 'Assess spread risk.', 'Identify the correct response priority.'],
    evidence: [
      { id: 'hot', label: 'Thermal hotspots', value: 'Multiple hotspots aligned with wind direction', source: 'FIRMS-style hotspot concept (demo)', sourceType: 'simulated', date: today },
      { id: 'smoke', label: 'Smoke plume', value: 'Visible plume extending downwind', source: 'True-color observation training', sourceType: 'simulated', date: today },
      { id: 'wx', label: 'Weather', value: 'Low humidity, warm air, gusty winds', source: 'NASA POWER-style weather context (demo)', sourceType: 'simulated', date: today },
    ],
    question: 'What is the most appropriate conclusion?',
    options: [
      { id: 'a', label: 'Active wildfire conditions with elevated spread risk', correct: true, why: 'Hotspots, smoke, and dry windy weather increase spread potential.' },
      { id: 'b', label: 'Harmless cloud formation', correct: false, why: 'Thermal hotspots and weather context indicate fire, not ordinary clouds.' },
      { id: 'c', label: 'Coastal erosion event', correct: false, why: 'Evidence is fire-related.' },
    ],
    findings: ['Thermal observations can indicate active fires.', 'Weather conditions strongly influence wildfire behavior and risk.'],
    sources: [
      { name: 'NASA FIRMS', date: today, type: 'archived', url: 'https://firms.modaps.eosdis.nasa.gov/', note: 'Conceptual reference; demo evidence shown' },
      { name: 'NASA POWER', date: today, type: 'simulated', url: 'https://power.larc.nasa.gov/' },
    ],
  },
  {
    id: 'ocean-conditions',
    title: 'Ocean Conditions',
    topic: 'Ocean conditions',
    accent: '#00D9FF',
    location: 'Coastal current zone (training scenario)',
    briefing: 'Examine ocean surface conditions and their potential environmental impacts.',
    objectives: ['Compare ocean and weather evidence.', 'Interpret changing conditions.', 'Report the key issue.'],
    evidence: [
      { id: 'sst', label: 'Sea surface temperature', value: 'Warmer than recent average in the target zone', source: 'Ocean observation training product', sourceType: 'simulated', date: today },
      { id: 'chl', label: 'Water color/chlorophyll signal', value: 'Patchy increase near coast', source: 'Ocean color concept (demo)', sourceType: 'simulated', date: today },
      { id: 'wind', label: 'Wind pattern', value: 'Onshore winds concentrating surface waters', source: 'Meteorological context (demo)', sourceType: 'simulated', date: today },
    ],
    question: 'Which issue should be investigated further?',
    options: [
      { id: 'a', label: 'Changing ocean conditions that may affect ecosystems and coastal waters', correct: true, why: 'Warm anomalies and biological signals warrant monitoring for ecosystem impacts.' },
      { id: 'b', label: 'Urban heat island over inland pavement', correct: false, why: 'Evidence is ocean-focused.' },
      { id: 'c', label: 'No meaningful environmental signal', correct: false, why: 'Multiple indicators show change.' },
    ],
    findings: ['Ocean temperature and color observations help scientists monitor marine conditions.', 'Coastal winds can influence how surface waters and materials concentrate.'],
    sources: [
      { name: 'NASA Earth Observatory - ocean topics', date: today, type: 'archived', url: 'https://earthobservatory.nasa.gov/' },
      { name: 'ORBIT ocean training dataset', date: today, type: 'simulated' },
    ],
  },
  {
    id: 'storm-tracker',
    title: 'Storm Tracker',
    topic: 'Storms',
    accent: '#176BFF',
    location: 'Tropical coastal basin (training scenario)',
    briefing: 'Track storm structure and assess likely hazards using cloud and environmental evidence.',
    objectives: ['Inspect storm evidence.', 'Evaluate hazard potential.', 'Submit the hazard assessment.'],
    evidence: [
      { id: 'cloud', label: 'Cloud structure', value: 'Organized convection with dense cloud bands', source: 'Satellite weather imagery concept (demo)', sourceType: 'simulated', date: today },
      { id: 'coast', label: 'Coastal exposure', value: 'Low-lying communities near the projected path', source: 'Risk mapping training layer', sourceType: 'simulated', date: today },
      { id: 'rain', label: 'Rainfall potential', value: 'Heavy precipitation likely near landfall zone', source: 'Weather model training context', sourceType: 'simulated', date: today },
    ],
    question: 'What is the primary concern?',
    options: [
      { id: 'a', label: 'Storm hazards including heavy rain, flooding risk, and community exposure', correct: true, why: 'Organized storm structure and exposed low-lying areas increase hazard risk.' },
      { id: 'b', label: 'Long-term drought from lack of clouds', correct: false, why: 'Evidence shows active storm systems and heavy rain potential.' },
      { id: 'c', label: 'Forest regrowth after fire', correct: false, why: 'Not supported by storm evidence.' },
    ],
    findings: ['Satellite observations help track storm structure and potential impacts.', 'Hazard assessment combines weather evidence with community exposure.'],
    sources: [
      { name: 'NASA GIBS weather/imagery concepts', date: today, type: 'archived', url: 'https://gibs.earthdata.nasa.gov/' },
      { name: 'ORBIT storm training scenario', date: today, type: 'simulated' },
    ],
  },
  {
    id: 'drought-signals',
    title: 'Drought Signals',
    topic: 'Drought',
    accent: '#FFB020',
    location: 'Agricultural basin (training scenario)',
    briefing: 'Investigate drought indicators by combining precipitation, vegetation, and surface evidence.',
    objectives: ['Review water and vegetation evidence.', 'Compare against normal conditions.', 'Identify the environmental issue.'],
    evidence: [
      { id: 'precip', label: 'Precipitation anomaly', value: 'Below-average rainfall over recent weeks', source: 'NASA POWER-style precipitation context (demo)', sourceType: 'simulated', date: today },
      { id: 'veg', label: 'Vegetation stress', value: 'Reduced greenness in cropland areas', source: 'Vegetation index training data', sourceType: 'simulated', date: today },
      { id: 'soil', label: 'Surface moisture indicator', value: 'Drying trend in exposed soils', source: 'Surface condition simulation', sourceType: 'simulated', date: today },
    ],
    question: 'What conclusion is best supported?',
    options: [
      { id: 'a', label: 'Emerging drought stress affecting vegetation and surface moisture', correct: true, why: 'Low rainfall, vegetation stress, and drying soils point to drought conditions.' },
      { id: 'b', label: 'Flash flooding from excess rainfall', correct: false, why: 'Rainfall is below average.' },
      { id: 'c', label: 'Healthy crop growth', correct: false, why: 'Greenness is reduced.' },
    ],
    findings: ['Drought monitoring uses multiple indicators, not just one measurement.', 'Vegetation and moisture signals can reveal impacts on agriculture and ecosystems.'],
    sources: [
      { name: 'NASA POWER', date: today, type: 'simulated', url: 'https://power.larc.nasa.gov/' },
      { name: 'NASA Earth Observatory - drought topics', date: today, type: 'archived', url: 'https://earthobservatory.nasa.gov/' },
    ],
  },
  {
    id: 'environmental-monitoring',
    title: 'Environmental Monitoring',
    topic: 'Environmental monitoring',
    accent: '#825BFF',
    location: 'Mixed watershed (training scenario)',
    briefing: 'Synthesize multiple Earth observations to produce an environmental monitoring report.',
    objectives: ['Review multi-source evidence.', 'Balance competing signals.', 'Select the most responsible monitoring conclusion.'],
    evidence: [
      { id: 'water', label: 'Reservoir extent', value: 'Slight decrease compared with prior baseline', source: 'Surface water training observation', sourceType: 'simulated', date: today },
      { id: 'veg2', label: 'Vegetation condition', value: 'Mixed: healthy upstream, stressed downstream', source: 'Vegetation index training data', sourceType: 'simulated', date: today },
      { id: 'temp', label: 'Temperature trend', value: 'Moderately warmer than average', source: 'NASA POWER-style context (demo)', sourceType: 'simulated', date: today },
    ],
    question: 'What is the best monitoring conclusion?',
    options: [
      { id: 'a', label: 'Combined environmental stress signals require continued multi-indicator monitoring', correct: true, why: 'Mixed evidence across water, vegetation, and temperature supports careful ongoing monitoring rather than a single-cause claim.' },
      { id: 'b', label: 'All indicators show full ecosystem recovery', correct: false, why: 'Some indicators show stress and decline.' },
      { id: 'c', label: 'No data is useful for environmental decisions', correct: false, why: 'Multiple observations provide useful evidence when interpreted responsibly.' },
    ],
    findings: ['Environmental decisions improve when scientists combine multiple observations.', 'Responsible reporting acknowledges uncertainty and uses evidence from several sources.'],
    sources: [
      { name: 'NASA Earthdata (conceptual reference)', date: today, type: 'archived', url: 'https://www.earthdata.nasa.gov/' },
      { name: 'NASA GIBS / POWER / Earth Observatory concepts', date: today, type: 'simulated' },
    ],
  },
]

export function getInvestigationMission(id: string) {
  return investigationMissions.find((m) => m.id === id)
}
