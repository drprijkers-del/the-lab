'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createSession, getTeamWowLevel, getTeamPlan } from '@/domain/wow/actions'
import { ANGLES, WowAngle, WowLevel, WOW_LEVELS, isProAngle } from '@/domain/wow/types'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/context'
import { AdminHeader } from '@/components/admin/header'

export default function NewWowSessionPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const t = useTranslation()
  const teamId = params.id as string

  // Pre-select angle from URL if provided (for repeat sessions)
  const preSelectedAngle = searchParams.get('angle') as WowAngle | null
  const validAngles = ANGLES.map(a => a.id)
  const initialAngle = preSelectedAngle && validAngles.includes(preSelectedAngle) ? preSelectedAngle : null

  const [selectedAngle, setSelectedAngle] = useState<WowAngle | null>(initialAngle)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teamLevel, setTeamLevel] = useState<WowLevel>('shu')
  const [teamPlan, setTeamPlan] = useState<'free' | 'pro'>('free')
  const [loadingLevel, setLoadingLevel] = useState(true)

  // Fetch team's wow level and plan
  useEffect(() => {
    let cancelled = false
    Promise.all([getTeamWowLevel(teamId), getTeamPlan(teamId)]).then(([level, plan]) => {
      if (!cancelled) {
        setTeamLevel(level)
        setTeamPlan(plan)
        setLoadingLevel(false)
      }
    })
    return () => { cancelled = true }
  }, [teamId])

  async function handleSubmit() {
    if (!selectedAngle) return

    setLoading(true)
    setError(null)

    const result = await createSession(teamId, selectedAngle)

    if (!result.success) {
      setError(result.error || 'Failed to create session')
      setLoading(false)
      return
    }

    router.push(`/wow/session/${result.sessionId}`)
  }

  // Map angle IDs to translation keys
  const getAngleLabel = (angleId: string) => {
    const labelMap: Record<string, string> = {
      scrum: t('angleScrum'),
      flow: t('angleFlow'),
      ownership: t('angleOwnership'),
      collaboration: t('angleCollaboration'),
      technical_excellence: t('angleTechnicalExcellence'),
      refinement: t('angleRefinement'),
      planning: t('anglePlanning'),
      retro: t('angleRetro'),
      demo: t('angleDemo'),
      obeya: t('angleObeya'),
      dependencies: t('angleDependencies'),
      psychological_safety: t('anglePsychSafety'),
      devops: t('angleDevOps'),
      stakeholder: t('angleStakeholder'),
      leadership: t('angleLeadership'),
    }
    return labelMap[angleId] || angleId
  }

  const getAngleDesc = (angleId: string) => {
    const descMap: Record<string, string> = {
      scrum: t('angleScrumDesc'),
      flow: t('angleFlowDesc'),
      ownership: t('angleOwnershipDesc'),
      collaboration: t('angleCollaborationDesc'),
      technical_excellence: t('angleTechnicalExcellenceDesc'),
      refinement: t('angleRefinementDesc'),
      planning: t('anglePlanningDesc'),
      retro: t('angleRetroDesc'),
      demo: t('angleDemoDesc'),
      obeya: t('angleObeyaDesc'),
      dependencies: t('angleDependenciesDesc'),
      psychological_safety: t('anglePsychSafetyDesc'),
      devops: t('angleDevOpsDesc'),
      stakeholder: t('angleStakeholderDesc'),
      leadership: t('angleLeadershipDesc'),
    }
    return descMap[angleId] || ''
  }

  // Level colors and info
  const levelConfig = {
    shu: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-400',
      accent: 'bg-amber-500',
      selectedBg: 'bg-amber-100 dark:bg-amber-900/30',
      selectedBorder: 'border-amber-400 dark:border-amber-600',
    },
    ha: {
      bg: 'bg-cyan-50 dark:bg-cyan-900/20',
      border: 'border-cyan-200 dark:border-cyan-800',
      text: 'text-cyan-700 dark:text-cyan-400',
      accent: 'bg-cyan-500',
      selectedBg: 'bg-cyan-100 dark:bg-cyan-900/30',
      selectedBorder: 'border-cyan-400 dark:border-cyan-600',
    },
    ri: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-700 dark:text-purple-400',
      accent: 'bg-purple-500',
      selectedBg: 'bg-purple-100 dark:bg-purple-900/30',
      selectedBorder: 'border-purple-400 dark:border-purple-600',
    },
  }

  const currentLevelInfo = WOW_LEVELS.find(l => l.id === teamLevel)
  const colors = levelConfig[teamLevel]

  return (
    <>
      <AdminHeader />
      <main className="max-w-2xl mx-auto px-4 pt-8 pb-24">
        {/* Back link */}
        <Link
          href={`/teams/${teamId}?tab=wow`}
          className="inline-flex items-center text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 mb-6 min-h-11 py-2"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('adminBack')}
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{t('startWowSession')}</h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">{t('justOne')}</p>
        </div>

        {/* Current Level Card */}
        {!loadingLevel && currentLevelInfo && (
          <div className={`${colors.bg} ${colors.border} border rounded-xl p-4 mb-6`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg ${colors.accent} flex items-center justify-center`}>
                <span className="text-2xl font-bold text-white">{currentLevelInfo.kanji}</span>
              </div>
              <div className="flex-1">
                <div className={`font-semibold ${colors.text}`}>
                  {currentLevelInfo.label} Level
                </div>
                <div className="text-sm text-stone-600 dark:text-stone-400">
                  {currentLevelInfo.description}
                </div>
              </div>
            </div>
          </div>
        )}

        {loadingLevel && (
          <div className="bg-stone-100 dark:bg-stone-800 rounded-xl p-4 mb-6 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-stone-300 dark:bg-stone-600" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-stone-300 dark:bg-stone-600 rounded w-24" />
                <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded w-48" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Angle Selection Label */}
        <div className="mb-4">
          <h2 className="text-sm font-medium text-stone-700 dark:text-stone-300">{t('pickAngle')}</h2>
        </div>

        {/* Angles Grid - compact so info box stays visible */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {ANGLES.map(angle => {
            const isSelected = selectedAngle === angle.id
            const isLocked = isProAngle(angle.id) && teamPlan !== 'pro'
            return (
              <button
                key={angle.id}
                onClick={() => !isLocked && setSelectedAngle(angle.id)}
                disabled={loading || isLocked}
                className={`relative p-2 sm:p-3 rounded-xl border-2 transition-all ${
                  isLocked
                    ? 'border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 opacity-60 cursor-not-allowed'
                    : isSelected
                      ? `${colors.selectedBg} ${colors.selectedBorder}`
                      : 'border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600 bg-white dark:bg-stone-800'
                }`}
              >
                {/* Pro badge */}
                {isLocked && (
                  <div className="absolute top-1.5 right-1.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">Pro</span>
                  </div>
                )}
                {/* Icon/Initial */}
                <div className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-white text-sm font-bold mb-1.5 ${
                  isLocked ? 'bg-stone-300 dark:bg-stone-600' : isSelected ? colors.accent : 'bg-stone-400 dark:bg-stone-600'
                }`}>
                  {getAngleLabel(angle.id).charAt(0)}
                </div>
                {/* Label - compact */}
                <div className={`font-medium text-[11px] sm:text-xs text-center leading-tight min-h-[2em] flex items-center justify-center ${
                  isLocked ? 'text-stone-400 dark:text-stone-500' : isSelected ? colors.text : 'text-stone-900 dark:text-stone-100'
                }`}>
                  {getAngleLabel(angle.id)}
                </div>
                {/* Selected indicator */}
                {isSelected && !isLocked && (
                  <div className={`absolute top-2 right-2 w-5 h-5 rounded-full ${colors.accent} flex items-center justify-center`}>
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Selected angle description */}
        {selectedAngle && (
          <div className={`${colors.bg} ${colors.border} border rounded-xl p-4 mb-6`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg ${colors.accent} flex items-center justify-center shrink-0`}>
                <span className="text-sm font-bold text-white">{getAngleLabel(selectedAngle).charAt(0)}</span>
              </div>
              <div>
                <div className={`font-medium ${colors.text}`}>{getAngleLabel(selectedAngle)}</div>
                <div className="text-sm text-stone-600 dark:text-stone-400 mt-0.5">
                  {getAngleDesc(selectedAngle)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <Link href={`/teams/${teamId}?tab=wow`} className="flex-1">
            <Button type="button" variant="secondary" className="w-full">
              {t('cancel')}
            </Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={!selectedAngle}
            loading={loading}
            className="flex-1"
          >
            {t('startSession')}
          </Button>
        </div>
      </main>
    </>
  )
}
