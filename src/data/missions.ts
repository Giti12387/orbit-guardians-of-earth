export type OverlayKind = 'true-color' | 'water' | 'vegetation' | 'thermal'

export interface MissionTarget {
  id: string
  name: string
  lat: number
  lon: number
  prompt: string
  correctOverlay: OverlayKind
  explanation: string
  nasaContext: string
}

export interface MissionDefinition {
  id: string
  title: string
  codename: string
  difficulty: 'Training' | 'Standard' | 'Advanced'
  category: 'Earth Observation'
  accent: string
  duration: string
  summary: string
  scientificBackground: string
  objectives: string[]
  targets: MissionTarget[]
}

export const coastalWatchMission: MissionDefinition = {
  id: 'coastal-watch',
  title: 'Coastal Watch',
  codename: 'Operation Shoreline',
  difficulty: 'Training',
  category: 'Earth Observation',
  accent: '#46E58A',
  duration: '6–8 min',
  summary:
    'Use satellite-style observation layers to investigate coastal regions and identify where Earth observation helps scientists monitor water, vegetation, and environmental change.',
  scientificBackground:
    'Earth-observing satellites collect measurements across different parts of the spectrum. Scientists combine true-color views with specialized products to study coastlines, floods, vegetation health, and surface temperature patterns. Real missions compare observations over time; this training simulation uses simplified overlays to teach the decision-making process.',
  objectives: [
    'Inspect three coastal investigation zones from orbit.',
    'Select the observation layer that best answers each scientific question.',
    'Capture observations and review the mission science report.',
  ],
  targets: [
    {
      id: 'delta',
      name: 'River Delta Watch',
      lat: 8,
      lon: 78,
      prompt:
        'Sediment and water movement are changing the shoreline near a river delta. Which layer best highlights water extent and coastal boundaries?',
      correctOverlay: 'water',
      explanation:
        'Water-sensitive views help separate land and water, making shoreline shape, river mouths, and inundation patterns easier to interpret.',
      nasaContext:
        'NASA Earth observations are used to monitor surface water, wetlands, and coastal change. Analysts compare imagery across dates to understand real shoreline movement.',
    },
    {
      id: 'mangrove',
      name: 'Mangrove Health Survey',
      lat: -6,
      lon: 106,
      prompt:
        'A coastal community depends on mangroves for storm protection. Which layer best helps assess vegetation presence and vigor?',
      correctOverlay: 'vegetation',
      explanation:
        'Vegetation-focused products emphasize plant cover and condition, supporting ecosystem monitoring and habitat protection decisions.',
      nasaContext:
        'Satellite observations support vegetation and land-cover studies, helping scientists track ecosystems such as mangroves, forests, and agricultural regions.',
    },
    {
      id: 'heat',
      name: 'Urban Coast Thermal Scan',
      lat: 24,
      lon: -82,
      prompt:
        'Researchers want to investigate warm surface patterns around a coastal urban area. Which layer is most useful for a thermal comparison?',
      correctOverlay: 'thermal',
      explanation:
        'Thermal-style views represent surface temperature differences, useful for comparing warmer urban surfaces, cooler water, and heat patterns.',
      nasaContext:
        'Thermal measurements from Earth-observing instruments help scientists study heat islands, sea-surface conditions, fires, and regional climate patterns.',
    },
  ],
}

export const overlayMeta: Record<OverlayKind, { label: string; description: string; tint: string }> = {
  'true-color': {
    label: 'True Color',
    description: 'Natural-looking view, similar to what human eyes would recognize.',
    tint: 'rgba(120, 170, 255, 0.08)',
  },
  water: {
    label: 'Water Index',
    description: 'Highlights water extent and shoreline contrast. Simulated training overlay.',
    tint: 'rgba(0, 217, 255, 0.22)',
  },
  vegetation: {
    label: 'Vegetation',
    description: 'Emphasizes vegetation patterns and ecosystem cover. Simulated training overlay.',
    tint: 'rgba(70, 229, 138, 0.22)',
  },
  thermal: {
    label: 'Thermal',
    description: 'Shows relative warm/cool surface patterns. Simulated training overlay.',
    tint: 'rgba(255, 176, 32, 0.22)',
  },
}
