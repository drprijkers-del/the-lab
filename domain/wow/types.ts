/**
 * Way of Work Types
 *
 * Core types for the Way of Work intervention tool.
 */

// Available angles for Way of Work sessions
export type WowAngle =
  | 'scrum'
  | 'flow'
  | 'ownership'
  | 'collaboration'
  | 'technical_excellence'
  | 'refinement'
  | 'planning'
  | 'retro'
  | 'demo'
  | 'obeya'
  | 'dependencies'
  | 'psychological_safety'
  | 'devops'
  | 'stakeholder'
  | 'leadership'

// Session lifecycle status
export type WowStatus = 'draft' | 'active' | 'closed'

// Way of Work progression levels (守破離)
export type WowLevel = 'shu' | 'ha' | 'ri'

// A single statement that team members respond to
export interface Statement {
  id: string
  text: string
  angle: WowAngle
  level: WowLevel  // Which Shu-Ha-Ri level this statement belongs to
}

// Team member's answers: statement_id -> score (1-5)
export type ResponseAnswers = Record<string, number>

// Way of Work session entity
export interface WowSession {
  id: string
  team_id: string
  session_code: string
  angle: WowAngle
  level: WowLevel  // Which Shu-Ha-Ri level this session was run at
  title: string | null
  status: WowStatus

  // Outcome (populated when closed)
  focus_area: string | null
  experiment: string | null
  experiment_owner: string | null
  followup_date: string | null  // ISO date string

  // Metadata
  created_by: string | null
  created_at: string
  closed_at: string | null
}

// Way of Work session with additional computed fields
export interface WowSessionWithStats extends WowSession {
  response_count: number
  team_name?: string
  overall_score?: number | null  // Average score (1-5), null if < 3 responses
}

// Individual response (anonymous)
export interface WowResponse {
  id: string
  session_id: string
  answers: ResponseAnswers
  device_id: string
  created_at: string
}

// Score distribution (how many 1s, 2s, 3s, 4s, 5s)
export type ScoreDistribution = [number, number, number, number, number]

// Statement score after aggregation
export interface StatementScore {
  statement: Statement
  score: number              // Average score (1-5)
  response_count: number     // How many answered this statement
  distribution: ScoreDistribution  // [count of 1s, 2s, 3s, 4s, 5s]
  variance: number           // Standard deviation (0 = agreement, >1 = disagreement)
}

// Synthesis output
export interface SynthesisResult {
  strengths: StatementScore[]   // Top 2 highest scoring
  tensions: StatementScore[]    // Top 2 lowest scoring
  all_scores: StatementScore[]  // All statements, sorted by score (high to low)
  overall_score: number         // Average across all answers (1-5)
  disagreement_count: number    // How many statements have high variance
  focus_area: string            // Derived from lowest cluster
  suggested_experiment: string  // Rule-based suggestion
  response_count: number        // Total responses
}

// Angle metadata for UI
export interface AngleInfo {
  id: WowAngle
  label: string
  description: string
}

// All wow angles - the statements for each angle vary by level (deeper questions as you progress)
export const ANGLES: AngleInfo[] = [
  { id: 'retro', label: 'Retro', description: 'Are we improving? Do actions lead to change?' },
  { id: 'planning', label: 'Planning', description: 'Is commitment realistic? Is the Sprint Goal clear?' },
  { id: 'scrum', label: 'Scrum', description: 'Are events useful? Is the framework helping?' },
  { id: 'flow', label: 'Flow', description: 'Is work moving? Are we finishing what we start?' },
  { id: 'collaboration', label: 'Collaboration', description: 'Are we working together? Is knowledge shared?' },
  { id: 'refinement', label: 'Refinement', description: 'Are stories ready? Is the backlog actionable?' },
  { id: 'ownership', label: 'Ownership', description: 'Does the team own it? Can we act without asking?' },
  { id: 'technical_excellence', label: 'Technical Excellence', description: 'Is the code getting better? Are we building quality in?' },
  { id: 'demo', label: 'Review', description: 'Are stakeholders engaged? Is feedback valuable?' },
  { id: 'obeya', label: 'Obeya', description: 'Is work visible? Does the team align around shared visuals?' },
  { id: 'dependencies', label: 'Dependencies', description: 'Are cross-team dependencies managed? Do handoffs work?' },
  { id: 'psychological_safety', label: 'Psychological Safety', description: 'Can we speak up? Is it safe to fail?' },
  { id: 'devops', label: 'DevOps', description: 'Is deployment smooth? Do we own our pipeline?' },
  { id: 'stakeholder', label: 'Stakeholders', description: 'Are stakeholders aligned? Is communication proactive?' },
  { id: 'leadership', label: 'Leadership', description: 'Do leaders enable teams? Is direction clear?' },
]

// Angles available on the Free plan — the essentials
export const FREE_ANGLES: WowAngle[] = ['retro', 'planning', 'scrum', 'flow', 'collaboration']

// Pro-only angles — require a Pro subscription
export const PRO_ANGLES: WowAngle[] = ['refinement', 'ownership', 'technical_excellence', 'demo', 'obeya', 'dependencies', 'psychological_safety', 'devops', 'stakeholder', 'leadership']

// Check if an angle requires Pro
export function isProAngle(angle: WowAngle): boolean {
  return PRO_ANGLES.includes(angle)
}

// Get all angles (all angles are available at all levels now)
export function getAnglesForLevel(_level: WowLevel): AngleInfo[] {
  return ANGLES
}

// Get all angles (kept for backwards compatibility)
export function getAnglesGroupedByLevel(): Record<WowLevel, AngleInfo[]> {
  return {
    shu: ANGLES,
    ha: ANGLES,
    ri: ANGLES,
  }
}

// Check if an angle is unlocked for a given team plan
export function isAngleUnlocked(angle: WowAngle, _teamLevel: WowLevel, teamPlan: 'free' | 'pro' = 'pro'): boolean {
  if (teamPlan === 'pro') return true
  return FREE_ANGLES.includes(angle)
}

// Helper to get angle info
export function getAngleInfo(angle: WowAngle): AngleInfo {
  return ANGLES.find(a => a.id === angle) || ANGLES[0]
}

// ============================================
// SHU-HA-RI LEVELS
// ============================================

// (WowLevel type is defined at the top of the file)

// Risk states (advisory only, no regression)
export type WowRiskState = 'none' | 'slipping' | 'low_participation' | 'stale'

// Level metadata with Japanese characters
export interface LevelInfo {
  id: WowLevel
  kanji: string
  label: string
  subtitle: string
  description: string
  questionDepth: string
}

// Level configuration
export const WOW_LEVELS: LevelInfo[] = [
  {
    id: 'shu',
    kanji: '守',
    label: 'Shu',
    subtitle: 'Learn the basics',
    description: 'Follow the structure. Build the habit. Trust the process.',
    questionDepth: 'Basics'
  },
  {
    id: 'ha',
    kanji: '破',
    label: 'Ha',
    subtitle: 'Adapt intentionally',
    description: 'Question the rules. Experiment safely. Find what works for your team.',
    questionDepth: 'Adaptive'
  },
  {
    id: 'ri',
    kanji: '離',
    label: 'Ri',
    subtitle: 'Mastery & own approach',
    description: 'Transcend the framework. Create your own process. Lead by example.',
    questionDepth: 'Mastery'
  }
]

// Helper to get level info
export function getLevelInfo(level: WowLevel): LevelInfo {
  return WOW_LEVELS.find(l => l.id === level) || WOW_LEVELS[0]
}

// Unlock requirements for UI display
export interface UnlockRequirement {
  key: string
  label: string
  met: boolean
  current?: number | string
  required?: number | string
}

// Progress toward next level
export interface LevelProgress {
  sessions_30d: number
  sessions_45d: number
  sessions_total: number
  followups_count: number
  unique_angles: number
  last_2_avg_score: number | null
  last_3_avg_score: number | null
  last_2_participation: number | null
  last_3_participation: number | null
  days_since_last_session: number | null
  can_unlock_ha: boolean
  can_unlock_ri: boolean
}

// Risk information
export interface LevelRisk {
  state: WowRiskState
  reason: string | null
}

// Full level evaluation result
export interface LevelEvaluation {
  level: WowLevel
  previous_level: WowLevel
  level_changed: boolean
  risk: LevelRisk
  progress: LevelProgress
}

// Get unlock requirements for display
export function getUnlockRequirements(
  currentLevel: WowLevel,
  progress: LevelProgress
): UnlockRequirement[] {
  if (currentLevel === 'shu') {
    // Requirements for Shu -> Ha
    return [
      {
        key: 'sessions',
        label: '3 sessions in 30 days',
        met: progress.sessions_30d >= 3,
        current: progress.sessions_30d,
        required: 3
      },
      {
        key: 'diversity',
        label: '5 sessions each with a different angle',
        met: progress.unique_angles >= 5,
        current: progress.unique_angles,
        required: 5
      },
      {
        key: 'score',
        label: 'Avg score ≥ 3.2',
        met: (progress.last_2_avg_score || 0) >= 3.2,
        current: progress.last_2_avg_score?.toFixed(1) || '—',
        required: '3.2'
      },
      {
        key: 'participation',
        label: 'Participation ≥ 60%',
        met: (progress.last_2_participation || 0) >= 0.60,
        current: progress.last_2_participation
          ? `${Math.round(progress.last_2_participation * 100)}%`
          : '—',
        required: '60%'
      }
    ]
  } else if (currentLevel === 'ha') {
    // Requirements for Ha -> Ri
    return [
      {
        key: 'total_sessions',
        label: '6 total sessions',
        met: progress.sessions_total >= 6,
        current: progress.sessions_total,
        required: 6
      },
      {
        key: 'diversity',
        label: '7 sessions each with a different angle',
        met: progress.unique_angles >= 7,
        current: progress.unique_angles,
        required: 7
      },
      {
        key: 'followups',
        label: '4 sessions with follow-up',
        met: progress.followups_count >= 4,
        current: progress.followups_count,
        required: 4
      },
      {
        key: 'recency',
        label: '3 sessions in 45 days',
        met: progress.sessions_45d >= 3,
        current: progress.sessions_45d,
        required: 3
      },
      {
        key: 'score',
        label: 'Avg score ≥ 3.5',
        met: (progress.last_3_avg_score || 0) >= 3.5,
        current: progress.last_3_avg_score?.toFixed(1) || '—',
        required: '3.5'
      },
      {
        key: 'participation',
        label: 'Participation ≥ 70%',
        met: (progress.last_3_participation || 0) >= 0.70,
        current: progress.last_3_participation
          ? `${Math.round(progress.last_3_participation * 100)}%`
          : '—',
        required: '70%'
      }
    ]
  }

  // Ri level - no more requirements
  return []
}
