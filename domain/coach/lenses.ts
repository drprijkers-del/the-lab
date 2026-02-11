export type CoachLens = 'general' | 'patterns' | 'product_vs_component' | 'obeya'

export interface LensConfig {
  id: CoachLens
  primaryAngles: string[]
  secondaryAngles: string[]
  systemPromptNL: string
  systemPromptEN: string
}

export const LENSES: Record<CoachLens, LensConfig> = {
  general: {
    id: 'general',
    primaryAngles: [], // all angles weighted equally
    secondaryAngles: [],
    systemPromptNL:
      'Bekijk het team vanuit een brede Agile lens. Focus op balans tussen alle angles, ritme van verbetering, en de trajectorie van teamontwikkeling. Let op dekkingsgaten (angles die niet gemeten zijn) en score-patronen.',
    systemPromptEN:
      'Look at the team through a broad Agile lens. Focus on balance across all angles, improvement rhythm, and the trajectory of team development. Note coverage gaps (unmeasured angles) and score patterns.',
  },
  patterns: {
    id: 'patterns',
    primaryAngles: [],
    secondaryAngles: [],
    systemPromptNL:
      'Zoek naar PATRONEN in de data: dingen die 3 of meer keer voorkomen. Kijk naar terugkerende thema\'s in WoW sessies, Vibe trends, en scores. Wat valt steeds weer op? Wat zijn de rode draden? Geef concrete focus-punten waar het team aan moet werken.',
    systemPromptEN:
      'Look for PATTERNS in the data: things that appear 3 or more times. Look for recurring themes across WoW sessions, Vibe trends, and scores. What keeps standing out? What are the common threads? Give concrete focus areas the team should work on.',
  },
  product_vs_component: {
    id: 'product_vs_component',
    primaryAngles: ['ownership', 'dependencies', 'stakeholders', 'refinement', 'review'],
    secondaryAngles: ['flow', 'collaboration', 'planning'],
    systemPromptNL:
      'Interpreteer teamgedrag door de lens van product-team vs. component-team patronen. Focus op: Ownership (eigen initiatief vs. toestemming vragen), Dependencies (waardestroom vs. handoffs), Stakeholders (directe relaties vs. proxy communicatie), Refinement (klantwaarde vs. technische taken), Review (feedback-loop vs. demo-plicht). Formuleer als hypotheses: "Dit kan erop wijzen dat..." — label het team NOOIT als product- of component-team.',
    systemPromptEN:
      'Interpret team behavior through the lens of product-team vs. component-team patterns. Focus on: Ownership (initiative vs. permission-seeking), Dependencies (value stream vs. handoffs), Stakeholders (direct relationships vs. proxy communication), Refinement (customer value vs. technical tasks), Review (feedback loop vs. demo obligation). Phrase as hypotheses: "This may indicate that..." — NEVER label the team as product or component team.',
  },
  obeya: {
    id: 'obeya',
    primaryAngles: ['obeya', 'flow', 'planning', 'review'],
    secondaryAngles: ['refinement', 'stakeholders', 'collaboration'],
    systemPromptNL:
      'Interpreteer teamgedrag door de lens van visueel management en Obeya-principes. Focus op: zichtbaarheid van werk (Obeya + Flow), gedeeld begrip (Planning + Review), transparantie naar stakeholders, en of visualisatie een samenwerkingstool is of slechts een rapportagemechanisme. Zoek correlaties tussen Obeya-scores en andere angles. Formuleer als hypotheses.',
    systemPromptEN:
      'Interpret team behavior through the lens of visual management and Obeya principles. Focus on: work visibility (Obeya + Flow), shared understanding (Planning + Review), stakeholder transparency, and whether visualization is a collaboration tool or merely a reporting mechanism. Look for correlations between Obeya scores and other angles. Phrase as hypotheses.',
  },
}

export const DEFAULT_LENS: CoachLens = 'general'

export function getLensConfig(lens: CoachLens): LensConfig {
  return LENSES[lens] || LENSES.general
}
