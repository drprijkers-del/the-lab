'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/context'

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

  return (
    <div className="space-y-6">
      {/* Usage frame - when to use this tab */}
      <div className="bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
        <p className="text-xs text-stone-500 dark:text-stone-400 text-center italic">
          {t('coachUsageFrame')}
        </p>
      </div>

      {/* Context cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-stone-50 dark:bg-stone-700 rounded-lg p-3">
          <div className="text-xs text-stone-500 dark:text-stone-400 mb-1">Pulse Score</div>
          <div className={`text-lg font-bold ${
            pulseScore === null ? 'text-stone-400' :
            pulseScore >= 4 ? 'text-green-600' :
            pulseScore >= 3 ? 'text-cyan-600' :
            pulseScore >= 2 ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {pulseScore?.toFixed(1) || '-'}
          </div>
        </div>
        <div className="bg-stone-50 dark:bg-stone-700 rounded-lg p-3">
          <div className="text-xs text-stone-500 dark:text-stone-400 mb-1">{t('signalParticipation')}</div>
          <div className={`text-lg font-bold ${
            pulseParticipation >= 80 ? 'text-green-600' :
            pulseParticipation >= 50 ? 'text-amber-600' :
            'text-red-600'
          }`}>
            {pulseParticipation}%
          </div>
        </div>
        {deltaTensions.length > 0 && (
          <div className="bg-stone-50 dark:bg-stone-700 rounded-lg p-3">
            <div className="text-xs text-stone-500 dark:text-stone-400 mb-1">{t('tension')}</div>
            <div className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
              {deltaTensions[0]?.area}
            </div>
          </div>
        )}
      </div>

      {/* Generate button */}
      {questionKeys.length === 0 && (
        <Button onClick={generateQuestions} loading={generating} className="w-full">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          {t('coachQuestionsGenerate')}
        </Button>
      )}

      {/* Generated questions */}
      {questionKeys.length > 0 && (
        <div className="space-y-3">
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
              className="text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 font-medium"
            >
              {t('coachRefresh')}
            </button>
          </div>

          <div className="space-y-2">
            {questionKeys.map((questionKey, idx) => (
              <div
                key={idx}
                className="p-4 bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800"
              >
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-stone-700 dark:text-stone-300 text-sm leading-relaxed">
                    {t(questionKey as any)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700">
            <h5 className="font-medium text-stone-700 dark:text-stone-300 text-sm mb-2">
              {t('coachTipsTitle')}
            </h5>
            <ul className="text-xs text-stone-500 dark:text-stone-400 space-y-1">
              <li>• {t('coachTip1')}</li>
              <li>• {t('coachTip2')}</li>
              <li>• {t('coachTip3')}</li>
              <li>• {t('coachTip4')}</li>
            </ul>
          </div>

          {/* Coaching posture hint */}
          <p className="text-xs text-stone-400 dark:text-stone-500 text-center italic">
            {t('coachPostureHint')}
          </p>
        </div>
      )}
    </div>
  )
}
