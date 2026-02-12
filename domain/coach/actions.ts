'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { getAnthropicClient } from '@/lib/anthropic/client'
import { getTeamMetrics } from '@/domain/metrics/actions'
import { getTeamSessions, getTeamStats, synthesizeSession } from '@/domain/wow/actions'
import { getLanguage } from '@/lib/i18n/server'
import { TIERS, type SubscriptionTier } from '@/domain/billing/tiers'
import { createHash } from 'crypto'

// ---- Types ----

export interface SignalBullet {
  text: string
  signalSource: 'vibe' | 'wow'
}

export interface CoachingTheme {
  title: string
  body: string
}

export interface ConversationQuestion {
  question: string
  context: string
}

export interface SuggestedIntervention {
  action: string
  timeframe: string
  format: string
}

export interface CoachPreparation {
  signalSummary: SignalBullet[]
  primaryTheme: CoachingTheme
  conversationQuestions: ConversationQuestion[]
  suggestedIntervention: SuggestedIntervention
  language: 'nl' | 'en'
  generatedAt: string
  fromCache: boolean
}

const MAX_DAILY_GENERATIONS = 5

// ---- Helpers ----

export async function getSubscriptionTier(): Promise<SubscriptionTier> {
  const adminUser = await requireAdmin()
  const supabase = await createAdminClient()

  const { data } = await supabase
    .from('admin_users')
    .select('subscription_tier')
    .eq('id', adminUser.id)
    .single()

  if (!data?.subscription_tier) return 'free'
  return data.subscription_tier as SubscriptionTier
}

async function computeDataHash(teamId: string): Promise<string> {
  const supabase = await createAdminClient()

  const [latestMood, latestSession, team] = await Promise.all([
    supabase
      .from('mood_entries')
      .select('entry_date')
      .eq('team_id', teamId)
      .order('entry_date', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('delta_sessions')
      .select('closed_at')
      .eq('team_id', teamId)
      .eq('status', 'closed')
      .order('closed_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('teams')
      .select('pulse_avg_score, delta_avg_score, pulse_participant_count')
      .eq('id', teamId)
      .single(),
  ])

  const hashInput = JSON.stringify({
    lastMoodDate: latestMood.data?.entry_date || 'none',
    lastSessionDate: latestSession.data?.closed_at || 'none',
    pulseAvg: team.data?.pulse_avg_score || 0,
    deltaAvg: team.data?.delta_avg_score || 0,
    participants: team.data?.pulse_participant_count || 0,
  })

  return createHash('sha256').update(hashInput).digest('hex').substring(0, 16)
}

async function getDailyGenerationCount(teamId: string): Promise<number> {
  const supabase = await createAdminClient()
  const { data } = await supabase.rpc('get_daily_generation_count', { p_team_id: teamId })
  return data || 0
}

// ---- AI Coach Preparation ----

export async function generateCoachPreparation(teamId: string, preferredLanguage?: 'nl' | 'en'): Promise<CoachPreparation> {
  await requireAdmin()
  const tier = await getSubscriptionTier()
  const coachMode = TIERS[tier].coachMode

  if (coachMode !== 'ai') {
    throw new Error('AI Coach requires Agile Coach or higher tier')
  }

  const supabase = await createAdminClient()

  // Check daily cap
  const dailyCount = await getDailyGenerationCount(teamId)
  if (dailyCount >= MAX_DAILY_GENERATIONS) {
    throw new Error('Daily generation limit reached')
  }

  // Check cache
  const currentHash = await computeDataHash(teamId)

  const { data: cached } = await supabase
    .from('coach_insights')
    .select('*')
    .eq('team_id', teamId)
    .eq('data_hash', currentHash)
    .eq('tier', tier)
    .single()

  if (cached) {
    const content = cached.content as Record<string, unknown>
    // Only use cache if it has the new format
    if (content && 'signalSummary' in content) {
      return {
        signalSummary: (content.signalSummary as SignalBullet[]) || [],
        primaryTheme: (content.primaryTheme as CoachingTheme) || { title: '', body: '' },
        conversationQuestions: (content.conversationQuestions as ConversationQuestion[]) || [],
        suggestedIntervention: (content.suggestedIntervention as SuggestedIntervention) || { action: '', timeframe: '', format: '' },
        language: (content.language as 'nl' | 'en') || 'nl',
        generatedAt: cached.generated_at,
        fromCache: true,
      }
    }
  }

  // Gather team data
  const [teamData, metrics, sessions, stats] = await Promise.all([
    supabase
      .from('teams')
      .select('name, pulse_avg_score, delta_avg_score, wow_level, expected_team_size, pulse_participant_count')
      .eq('id', teamId)
      .single(),
    getTeamMetrics(teamId, 60),
    getTeamSessions(teamId),
    getTeamStats(teamId),
  ])

  const team = teamData.data
  if (!team) throw new Error('Team not found')

  // Synthesize recent closed sessions (top 3)
  const closedSessions = sessions.filter(s => s.status === 'closed').slice(0, 5)
  const syntheses = await Promise.all(
    closedSessions.slice(0, 3).map(async (s) => {
      const synth = await synthesizeSession(s.id)
      if (!synth) return null
      return {
        angle: s.angle,
        score: s.overall_score,
        strengths: synth.strengths.map(st => st.statement.text),
        tensions: synth.tensions.map(t => t.statement.text),
      }
    })
  )

  const language = preferredLanguage || await getLanguage()

  // Build structured data context
  const dataContext = JSON.stringify({
    teamName: team.name,
    vibe: metrics ? {
      weekScore: metrics.weekVibe.value,
      trend: metrics.momentum.direction,
      velocity: metrics.momentum.velocity,
      daysTrending: metrics.momentum.daysTrending,
      participation: metrics.participation.rate,
      zone: metrics.weekVibe.zone,
      maturity: metrics.maturity.level,
    } : null,
    wow: {
      totalSessions: stats.totalSessions,
      averageScore: stats.averageScore,
      trend: stats.trend,
      trendDrivers: stats.trendDrivers,
      recentScores: stats.recentScores.slice(0, 5),
      sessionsByAngle: stats.sessionsByAngle,
      level: team.wow_level || 'shu',
    },
    recentSessionDetails: syntheses.filter(Boolean),
  }, null, 2)

  const systemPrompt = language === 'nl'
    ? `Je bent een ervaren Agile Coach die een collega-coach helpt hun volgende teamgesprek voor te bereiden. Analyseer teamdata en geef gestructureerde output.

Regels:
- Formuleer als hypotheses ("Dit kan wijzen op...")
- Label het team NOOIT
- Verwijs ALLEEN naar bestaande data — verzin geen cijfers
- Wees concreet en specifiek, geen generieke coaching
- Schrijf ALLES in het Nederlands
- Antwoord ALLEEN in valid JSON`
    : `You are an experienced Agile Coach helping a fellow coach prepare their next team conversation. Analyze team data and provide structured output.

Rules:
- Phrase as hypotheses ("This may indicate...")
- NEVER label the team
- ONLY reference existing data — do not invent numbers
- Be concrete and specific, no generic coaching
- Write EVERYTHING in English
- Respond ONLY in valid JSON`

  const userPrompt = language === 'nl'
    ? `Bereid een teamgesprek voor op basis van deze data. Schrijf ALLES in het Nederlands.

Teamdata:
${dataContext}

Geef EXACT dit JSON formaat:
{"signalSummary":[{"text":"korte bullet met echt datapunt","signalSource":"vibe of wow"}],"primaryTheme":{"title":"kort label","body":"max 3 zinnen over spanning of groeikans"},"conversationQuestions":[{"question":"open vraag, concreet","context":"1 zin waarom nu"}],"suggestedIntervention":{"action":"specifieke actie","timeframe":"bijv. deze sprint","format":"bijv. retro oefening met silent writing"}}

signalSummary: EXACT 3 bullets, elke bullet verwijst naar een echt datapunt (score, trend, angle)
primaryTheme: EXACT 1 — kies de belangrijkste spanning of groeikans — niet generiek
conversationQuestions: EXACT 4 — open, concreet, geen "Hoe voel je je over..."
suggestedIntervention: EXACT 1 — specifiek, tijdsgebonden, facilitatie-gericht`
    : `Prepare a team conversation based on this data. Write EVERYTHING in English.

Team data:
${dataContext}

Return EXACTLY this JSON format:
{"signalSummary":[{"text":"short bullet referencing real data point","signalSource":"vibe or wow"}],"primaryTheme":{"title":"short label","body":"max 3 sentences about tension or growth opportunity"},"conversationQuestions":[{"question":"open question, concrete","context":"1 sentence why now"}],"suggestedIntervention":{"action":"specific action","timeframe":"e.g. this sprint","format":"e.g. retro exercise with silent writing"}}

signalSummary: EXACTLY 3 bullets, each referencing a real data point (score, trend, angle)
primaryTheme: EXACTLY 1 — pick the most important tension or growth opportunity — not generic
conversationQuestions: EXACTLY 4 — open, concrete, no "How do you feel about..."
suggestedIntervention: EXACTLY 1 — specific, time-bound, facilitation-oriented`

  // Call Claude Haiku
  const client = getAnthropicClient()
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  // Parse response
  const responseText = response.content
    .filter(block => block.type === 'text')
    .map(block => 'text' in block ? block.text : '')
    .join('')

  const cleanJson = (s: string) => s
    .replace(/```json\n?/g, '').replace(/```\n?/g, '')
    .replace(/,\s*([\]}])/g, '$1')
    .replace(/[\r\n]+/g, ' ')
    .trim()

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(cleanJson(responseText))
  } catch {
    const match = responseText.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Failed to parse AI response')
    try {
      parsed = JSON.parse(cleanJson(match[0]))
    } catch {
      console.error('Coach AI returned invalid JSON, using empty fallback')
      parsed = {}
    }
  }

  // Validate and enforce exact counts
  let signals = (parsed.signalSummary as SignalBullet[]) || []
  signals = signals.slice(0, 3)
  while (signals.length < 3) signals.push({ text: '—', signalSource: 'vibe' })

  let questions = (parsed.conversationQuestions as ConversationQuestion[]) || []
  questions = questions.slice(0, 4)
  while (questions.length < 4) questions.push({ question: '—', context: '' })

  const theme: CoachingTheme = (parsed.primaryTheme as CoachingTheme) || { title: '—', body: '' }
  const intervention: SuggestedIntervention = (parsed.suggestedIntervention as SuggestedIntervention) || { action: '—', timeframe: '', format: '' }

  const result: CoachPreparation = {
    signalSummary: signals,
    primaryTheme: theme,
    conversationQuestions: questions,
    suggestedIntervention: intervention,
    language,
    generatedAt: new Date().toISOString(),
    fromCache: false,
  }

  // Cache the result
  await supabase.from('coach_insights').upsert({
    team_id: teamId,
    data_hash: currentHash,
    tier,
    content: { ...result },
    generation_count: 1,
    generated_at: new Date().toISOString(),
  }, {
    onConflict: 'team_id,data_hash,tier',
  })

  return result
}

// ---- Rule-Based Preparation (Scrum Master tier) ----

// Question banks for rule-based preparation
const QUESTION_BANK = {
  lowPulse: [
    { nl: 'Wat maakt dat de energie in het team lager lijkt dan normaal?', en: 'What might be causing the team\'s energy to be lower than usual?' },
    { nl: 'Zijn er dingen die het team bezighouden die niet op de sprint backlog staan?', en: 'Are there things on the team\'s mind that aren\'t on the sprint backlog?' },
    { nl: 'Hoe ziet een goede werkdag eruit voor dit team — en wanneer was de laatste?', en: 'What does a good work day look like for this team — and when was the last one?' },
    { nl: 'Welke blokkades ervaart het team die buiten jullie invloed liggen?', en: 'What blockers does the team experience that are outside your control?' },
  ],
  lowParticipation: [
    { nl: 'Wat zou het team helpen om vaker hun signaal te delen?', en: 'What would help the team share their signals more often?' },
    { nl: 'Voelt het team dat hun input ergens toe leidt?', en: 'Does the team feel their input leads to something?' },
    { nl: 'Is er een reden dat teamleden de check-in overslaan?', en: 'Is there a reason team members skip the check-in?' },
  ],
  tension: [
    { nl: 'Waar zit de meeste wrijving in jullie manier van werken op dit moment?', en: 'Where is the most friction in your way of working right now?' },
    { nl: 'Als je één ding zou mogen veranderen aan hoe jullie samenwerken, wat zou dat zijn?', en: 'If you could change one thing about how you collaborate, what would it be?' },
    { nl: 'Wat is het verschil tussen hoe het team denkt te werken en hoe het echt gaat?', en: 'What\'s the gap between how the team thinks it works and how it actually goes?' },
  ],
  general: [
    { nl: 'Wat heeft het team de afgelopen week geleerd?', en: 'What has the team learned in the past week?' },
    { nl: 'Waar is het team trots op en waarom?', en: 'What is the team proud of and why?' },
    { nl: 'Welk experiment zou het team willen proberen?', en: 'What experiment would the team like to try?' },
    { nl: 'Wat is de grootste onzekerheid waar het team mee zit?', en: 'What is the biggest uncertainty the team is facing?' },
  ],
}

const INTERVENTION_BANK = {
  lowPulse: [
    { action: { nl: 'Voer een korte team health check uit met silent writing', en: 'Run a short team health check using silent writing' }, timeframe: { nl: 'Deze week', en: 'This week' }, format: { nl: 'Team sessie, 30 minuten', en: 'Team session, 30 minutes' } },
  ],
  lowParticipation: [
    { action: { nl: 'Bespreek in de retro waarom de check-in waardevol is — of niet', en: 'Discuss in the retro why the check-in is valuable — or not' }, timeframe: { nl: 'Volgende retro', en: 'Next retro' }, format: { nl: 'Retro agenda punt, 10 minuten', en: 'Retro agenda item, 10 minutes' } },
  ],
  tension: [
    { action: { nl: 'Faciliteer een focused retro op het laagst scorende onderwerp met silent writing eerst', en: 'Facilitate a focused retro on the lowest-scoring topic with silent writing first' }, timeframe: { nl: 'Binnen 2 weken', en: 'Within 2 weeks' }, format: { nl: 'Gerichte retro, 45 minuten', en: 'Focused retro, 45 minutes' } },
  ],
  general: [
    { action: { nl: 'Plan een 1-op-1 met de Product Owner om de teamdynamiek te bespreken', en: 'Schedule a 1-on-1 with the Product Owner to discuss team dynamics' }, timeframe: { nl: 'Deze sprint', en: 'This sprint' }, format: { nl: '1-op-1 gesprek, 20 minuten', en: '1-on-1 conversation, 20 minutes' } },
  ],
}

const THEME_BANK = {
  lowPulse: {
    title: { nl: 'Dalende teamenergie', en: 'Declining team energy' },
    body: { nl: 'De Vibe score wijst op een dalende trend. Dit kan wijzen op verborgen frustraties, onbesproken blokkades of vermoeidheid. Een gericht gesprek over wat er speelt kan helpen om de oorzaak boven tafel te krijgen.', en: 'The Vibe score indicates a declining trend. This may point to hidden frustrations, unaddressed blockers, or fatigue. A focused conversation about what\'s going on can help surface the root cause.' },
  },
  lowParticipation: {
    title: { nl: 'Lage betrokkenheid bij check-ins', en: 'Low check-in engagement' },
    body: { nl: 'De participatiegraad is laag. Dit kan betekenen dat het team de waarde niet ziet, dat er te weinig psychologische veiligheid is, of dat de timing niet werkt. Het is een signaal om te onderzoeken, niet om te forceren.', en: 'Participation rate is low. This may mean the team doesn\'t see the value, there\'s insufficient psychological safety, or the timing doesn\'t work. It\'s a signal to explore, not to force.' },
  },
  tension: {
    title: { nl: 'Spanning in werkwijze', en: 'Way of working tension' },
    body: { nl: 'Way of Work sessies tonen lage scores op specifieke onderwerpen. Dit wijst op concrete verbeterpunten die het team zelf heeft geïdentificeerd. Een gesprek hierover kan richting geven aan het volgende experiment.', en: 'Way of Work sessions show low scores on specific topics. This points to concrete improvement areas the team has identified itself. A conversation about this can guide the next experiment.' },
  },
  general: {
    title: { nl: 'Teamontwikkeling', en: 'Team development' },
    body: { nl: 'Het team heeft actieve data. Gebruik dit moment om te reflecteren op patronen en volgende stappen. Wat gaat goed en waar liggen groeikansen?', en: 'The team has active data. Use this moment to reflect on patterns and next steps. What\'s going well and where are the growth opportunities?' },
  },
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export async function generateRuleBasedPreparation(teamId: string, preferredLanguage?: 'nl' | 'en'): Promise<CoachPreparation> {
  await requireAdmin()

  const [metrics, sessions] = await Promise.all([
    getTeamMetrics(teamId, 14),
    getTeamSessions(teamId),
  ])

  const language = preferredLanguage || await getLanguage()
  const lang = language as 'nl' | 'en'

  const vibeScore = metrics?.weekVibe?.value ?? null
  const participation = metrics?.participation?.rate ?? 0
  const trend = metrics?.momentum?.direction ?? 'stable'

  const closedSessions = sessions.filter(s => s.status === 'closed' && s.overall_score != null)
  const lowestSession = closedSessions.sort((a, b) => (a.overall_score ?? 5) - (b.overall_score ?? 5))[0]

  // Determine primary signal type
  const isLowPulse = vibeScore !== null && vibeScore < 3
  const isLowParticipation = participation < 50
  const hasTension = lowestSession && (lowestSession.overall_score ?? 5) < 3.5
  const primarySignal = isLowPulse ? 'lowPulse' : hasTension ? 'tension' : isLowParticipation ? 'lowParticipation' : 'general'

  // Build signal summary
  const signals: SignalBullet[] = []
  if (vibeScore !== null) {
    signals.push({
      text: lang === 'nl'
        ? `Vibe score: ${vibeScore.toFixed(1)} (trend: ${trend === 'rising' ? 'stijgend' : trend === 'declining' ? 'dalend' : 'stabiel'})`
        : `Vibe score: ${vibeScore.toFixed(1)} (trend: ${trend})`,
      signalSource: 'vibe',
    })
  }
  if (participation > 0) {
    signals.push({
      text: lang === 'nl'
        ? `Participatie: ${Math.round(participation)}%`
        : `Participation: ${Math.round(participation)}%`,
      signalSource: 'vibe',
    })
  }
  if (lowestSession) {
    signals.push({
      text: lang === 'nl'
        ? `Laagste WoW score: ${lowestSession.angle} (${lowestSession.overall_score?.toFixed(1)})`
        : `Lowest WoW score: ${lowestSession.angle} (${lowestSession.overall_score?.toFixed(1)})`,
      signalSource: 'wow',
    })
  }
  // Pad to 3
  while (signals.length < 3) {
    signals.push({
      text: lang === 'nl' ? `WoW sessies: ${closedSessions.length} afgerond` : `WoW sessions: ${closedSessions.length} completed`,
      signalSource: 'wow',
    })
  }

  // Build questions (4 total)
  const questions: ConversationQuestion[] = []
  const primaryQuestions = QUESTION_BANK[primarySignal]
  const shuffled = [...primaryQuestions].sort(() => Math.random() - 0.5)
  for (const q of shuffled.slice(0, 2)) {
    questions.push({ question: q[lang], context: '' })
  }
  // Add general questions to fill
  const generalShuffled = [...QUESTION_BANK.general].sort(() => Math.random() - 0.5)
  for (const q of generalShuffled) {
    if (questions.length >= 4) break
    if (!questions.some(existing => existing.question === q[lang])) {
      questions.push({ question: q[lang], context: '' })
    }
  }

  // Theme
  const themeData = THEME_BANK[primarySignal]
  const theme: CoachingTheme = { title: themeData.title[lang], body: themeData.body[lang] }

  // Intervention
  const interventionData = pickRandom(INTERVENTION_BANK[primarySignal])
  const intervention: SuggestedIntervention = {
    action: interventionData.action[lang],
    timeframe: interventionData.timeframe[lang],
    format: interventionData.format[lang],
  }

  return {
    signalSummary: signals.slice(0, 3),
    primaryTheme: theme,
    conversationQuestions: questions.slice(0, 4),
    suggestedIntervention: intervention,
    language,
    generatedAt: new Date().toISOString(),
    fromCache: false,
  }
}
