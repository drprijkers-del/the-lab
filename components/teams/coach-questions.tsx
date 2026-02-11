'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import type { TranslationKey } from '@/lib/i18n/translations'

interface CoachQuestionsProps {
  pulseScore: number | null
  pulseParticipation: number
  deltaTensions?: { area: string; score: number }[]
  teamName: string
}

// Question template keys - will be resolved via translations
const QUESTION_KEYS = {
  lowPulse: ['coachQ_lowPulse1', 'coachQ_lowPulse2', 'coachQ_lowPulse3', 'coachQ_lowPulse4', 'coachQ_lowPulse5'],
  lowParticipation: ['coachQ_lowParticipation1', 'coachQ_lowParticipation2', 'coachQ_lowParticipation3', 'coachQ_lowParticipation4'],
  flowProblems: ['coachQ_flow1', 'coachQ_flow2', 'coachQ_flow3', 'coachQ_flow4'],
  ownershipProblems: ['coachQ_ownership1', 'coachQ_ownership2', 'coachQ_ownership3', 'coachQ_ownership4'],
  collaborationProblems: ['coachQ_collaboration1', 'coachQ_collaboration2', 'coachQ_collaboration3', 'coachQ_collaboration4'],
  scrumProblems: ['coachQ_scrum1', 'coachQ_scrum2', 'coachQ_scrum3', 'coachQ_scrum4'],
  general: ['coachQ_general1', 'coachQ_general2', 'coachQ_general3', 'coachQ_general4', 'coachQ_general5'],
}

// Map Delta angles to question categories
const ANGLE_TO_CATEGORY: Record<string, keyof typeof QUESTION_KEYS> = {
  flow: 'flowProblems',
  ownership: 'ownershipProblems',
  collaboration: 'collaborationProblems',
  scrum: 'scrumProblems',
  technical_excellence: 'general',
  refinement: 'flowProblems',
  planning: 'scrumProblems',
  retro: 'scrumProblems',
  demo: 'collaborationProblems',
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function CoachQuestions({
  pulseScore,
  pulseParticipation,
  deltaTensions = [],
}: CoachQuestionsProps) {
  const t = useTranslation()
  const [questionKeys, setQuestionKeys] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)

  const generateQuestions = () => {
    setGenerating(true)

    const generated: string[] = []

    // Add questions based on Pulse score
    if (pulseScore !== null && pulseScore < 3) {
      generated.push(...pickRandom(QUESTION_KEYS.lowPulse, 2))
    }

    // Add questions based on participation
    if (pulseParticipation < 50) {
      generated.push(...pickRandom(QUESTION_KEYS.lowParticipation, 1))
    }

    // Add questions based on Delta tensions
    for (const tension of deltaTensions.slice(0, 2)) {
      const category = ANGLE_TO_CATEGORY[tension.area] || 'general'
      generated.push(...pickRandom(QUESTION_KEYS[category], 1))
    }

    // Always add some general questions
    generated.push(...pickRandom(QUESTION_KEYS.general, 2))

    // Dedupe and limit
    const unique = [...new Set(generated)].slice(0, 5)

    // Simulate a brief delay for effect
    setTimeout(() => {
      setQuestionKeys(unique)
      setGenerating(false)
    }, 500)
  }

  const tips = [t('coachTip1'), t('coachTip2'), t('coachTip3'), t('coachTip4')]

  return (
    <div className="space-y-6">
      {/* Usage frame */}
      <p className="text-xs text-stone-400 dark:text-stone-500 italic text-center leading-relaxed">
        {t('coachUsageFrame')}
      </p>

      {/* Context signals — compact row */}
      <div className="bg-stone-50 dark:bg-stone-700/30 rounded-xl overflow-hidden">
        <div className="divide-y divide-stone-100 dark:divide-stone-700">
          {/* Pulse score row */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-pink-600 dark:text-pink-400" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12h3l2-6 3 12 3-8 2 4h7" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-sm text-stone-900 dark:text-stone-100">Vibe Score</div>
                <div className="text-xs text-stone-500 dark:text-stone-400">{t('signalParticipation')}: {pulseParticipation}%</div>
              </div>
            </div>
            <span className={`text-lg font-bold tabular-nums ${
              pulseScore === null ? 'text-stone-300 dark:text-stone-600' :
              pulseScore >= 4 ? 'text-green-600 dark:text-green-400' :
              pulseScore >= 3 ? 'text-cyan-600 dark:text-cyan-400' :
              pulseScore >= 2 ? 'text-amber-600 dark:text-amber-400' :
              'text-red-600 dark:text-red-400'
            }`}>
              {pulseScore?.toFixed(1) || '—'}
            </span>
          </div>

          {/* Tension row */}
          {deltaTensions.length > 0 && (
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">Δ</span>
                </div>
                <div>
                  <div className="font-medium text-sm text-stone-900 dark:text-stone-100">{t('tension')}</div>
                  <div className="text-xs text-stone-500 dark:text-stone-400">{deltaTensions[0]?.area}</div>
                </div>
              </div>
              <span className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">
                {deltaTensions[0]?.score.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Generate — ghost tile when no questions yet */}
      {questionKeys.length === 0 && (
        <div className="bg-stone-50 dark:bg-stone-700/30 rounded-xl overflow-hidden">
          <button
            onClick={generateQuestions}
            disabled={generating}
            className="flex items-center gap-3 p-4 w-full text-left group hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-lg border-2 border-dashed border-stone-200 dark:border-stone-600 group-hover:border-emerald-400 dark:group-hover:border-emerald-600 flex items-center justify-center transition-colors">
              {generating ? (
                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 text-stone-400 dark:text-stone-500 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              )}
            </div>
            <div>
              <span className="block text-sm font-medium text-stone-400 dark:text-stone-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {t('coachQuestionsGenerate')}
              </span>
              <span className="block text-xs text-stone-400 dark:text-stone-500">
                {t('coachPostureHint')}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Generated questions */}
      {questionKeys.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-stone-900 dark:text-stone-100 text-sm">
                {t('coachObservationsTitle')}
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {t('coachObservationsSubtitle')}
              </p>
            </div>
            <button
              onClick={generateQuestions}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-400 dark:text-stone-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              {t('coachRefresh')}
            </button>
          </div>

          <div className="bg-stone-50 dark:bg-stone-700/30 rounded-xl overflow-hidden divide-y divide-stone-100 dark:divide-stone-700">
            {questionKeys.map((questionKey, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed">
                  {t(questionKey as TranslationKey)}
                </p>
              </div>
            ))}
          </div>

          {/* Tips — step guide style */}
          <div className="grid grid-cols-2 gap-2">
            {tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50 dark:bg-stone-700/30">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-xs text-stone-600 dark:text-stone-300 leading-snug">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
