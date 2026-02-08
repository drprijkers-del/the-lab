'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/context'
import { getComparableSessions, compareSessions, SessionComparison } from '@/domain/wow/actions'

// Map angle IDs to translation keys
const ANGLE_TRANSLATION_KEYS: Record<string, string> = {
  scrum: 'angleScrum',
  flow: 'angleFlow',
  ownership: 'angleOwnership',
  collaboration: 'angleCollaboration',
  technical_excellence: 'angleTechnicalExcellence',
  refinement: 'angleRefinement',
  planning: 'anglePlanning',
  retro: 'angleRetro',
  demo: 'angleDemo',
}

interface SessionCompareProps {
  teamId: string
  onClose: () => void
}

export function SessionCompare({ teamId, onClose }: SessionCompareProps) {
  const t = useTranslation()
  const [loading, setLoading] = useState(true)
  const [comparing, setComparing] = useState(false)
  const [comparableData, setComparableData] = useState<{
    angle: string
    sessions: { id: string; date: string; score: number }[]
  }[]>([])
  const [selectedAngle, setSelectedAngle] = useState<string | null>(null)
  const [session1, setSession1] = useState<string | null>(null)
  const [session2, setSession2] = useState<string | null>(null)
  const [comparison, setComparison] = useState<SessionComparison | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load comparable sessions
  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await getComparableSessions(teamId)
      setComparableData(data)
      if (data.length > 0) {
        setSelectedAngle(data[0].angle)
      }
      setLoading(false)
    }
    load()
  }, [teamId])

  const selectedAngleData = comparableData.find(d => d.angle === selectedAngle)

  const handleCompare = async () => {
    if (!session1 || !session2) return
    setComparing(true)
    setError(null)

    const result = await compareSessions(session1, session2)
    setComparing(false)

    if (!result.success) {
      setError(result.error || 'Comparison failed')
      return
    }

    setComparison(result.data!)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl p-6">
          <div className="animate-pulse text-stone-500">{t('loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-stone-800 px-6 py-4 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
            {t('wowCompareTitle')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {comparableData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-stone-500 dark:text-stone-400">
                {t('needsTwoSessions')}
              </p>
            </div>
          ) : !comparison ? (
            <div className="space-y-6">
              {/* Angle selector */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Angle
                </label>
                <div className="flex flex-wrap gap-2">
                  {comparableData.map(({ angle }) => (
                    <button
                      key={angle}
                      onClick={() => {
                        setSelectedAngle(angle)
                        setSession1(null)
                        setSession2(null)
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        selectedAngle === angle
                          ? 'bg-cyan-500 text-white'
                          : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-600'
                      }`}
                    >
                      {t(ANGLE_TRANSLATION_KEYS[angle] as any) || angle}
                    </button>
                  ))}
                </div>
              </div>

              {/* Session selectors */}
              {selectedAngleData && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                      {t('wowCompareSelect')} 1
                    </label>
                    <div className="space-y-2">
                      {selectedAngleData.sessions.map(session => (
                        <button
                          key={session.id}
                          onClick={() => setSession1(session.id)}
                          disabled={session.id === session2}
                          className={`w-full p-3 rounded-lg text-left transition-colors ${
                            session1 === session.id
                              ? 'bg-cyan-100 dark:bg-cyan-900/30 border-2 border-cyan-500'
                              : session.id === session2
                              ? 'opacity-50 cursor-not-allowed bg-stone-50 dark:bg-stone-700'
                              : 'bg-stone-50 dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 border-2 border-transparent'
                          }`}
                        >
                          <div className="font-medium text-stone-900 dark:text-stone-100">
                            {formatDate(session.date)}
                          </div>
                          <div className="text-sm text-stone-500 dark:text-stone-400">
                            Score: {session.score}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                      {t('wowCompareSelect')} 2
                    </label>
                    <div className="space-y-2">
                      {selectedAngleData.sessions.map(session => (
                        <button
                          key={session.id}
                          onClick={() => setSession2(session.id)}
                          disabled={session.id === session1}
                          className={`w-full p-3 rounded-lg text-left transition-colors ${
                            session2 === session.id
                              ? 'bg-cyan-100 dark:bg-cyan-900/30 border-2 border-cyan-500'
                              : session.id === session1
                              ? 'opacity-50 cursor-not-allowed bg-stone-50 dark:bg-stone-700'
                              : 'bg-stone-50 dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 border-2 border-transparent'
                          }`}
                        >
                          <div className="font-medium text-stone-900 dark:text-stone-100">
                            {formatDate(session.date)}
                          </div>
                          <div className="text-sm text-stone-500 dark:text-stone-400">
                            Score: {session.score}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Compare button */}
              <Button
                onClick={handleCompare}
                disabled={!session1 || !session2}
                loading={comparing}
                className="w-full"
              >
                {t('wowCompare')}
              </Button>
            </div>
          ) : (
            /* Comparison Results */
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {comparison.summary.improved_count}
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300">
                    {t('wowCompareImproved')}
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {comparison.summary.declined_count}
                  </div>
                  <div className="text-xs text-red-700 dark:text-red-300">
                    {t('wowCompareDeclined')}
                  </div>
                </div>
                <div className="bg-stone-50 dark:bg-stone-700 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-stone-600 dark:text-stone-300">
                    {comparison.summary.unchanged_count}
                  </div>
                  <div className="text-xs text-stone-500 dark:text-stone-400">
                    {t('wowCompareUnchanged')}
                  </div>
                </div>
              </div>

              {/* Overall score change */}
              <div className="bg-stone-50 dark:bg-stone-700 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-stone-500 dark:text-stone-400">{t('overallTeamScore')}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-stone-600 dark:text-stone-300">
                      {comparison.session1.overall_score}
                    </span>
                    <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span className="text-lg font-bold text-stone-900 dark:text-stone-100">
                      {comparison.session2.overall_score}
                    </span>
                  </div>
                </div>
                <div className={`text-xl font-bold ${
                  comparison.summary.overall_change > 0 ? 'text-green-500' :
                  comparison.summary.overall_change < 0 ? 'text-red-500' :
                  'text-stone-400'
                }`}>
                  {comparison.summary.overall_change > 0 ? '+' : ''}
                  {comparison.summary.overall_change}
                </div>
              </div>

              {/* Statement comparisons */}
              <div className="space-y-2">
                <h3 className="font-medium text-stone-900 dark:text-stone-100">{t('allStatements')}</h3>
                {comparison.statements.map(stmt => (
                  <div
                    key={stmt.id}
                    className={`p-3 rounded-lg border ${
                      stmt.status === 'improved' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' :
                      stmt.status === 'declined' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' :
                      'bg-stone-50 dark:bg-stone-700 border-stone-200 dark:border-stone-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-stone-700 dark:text-stone-300 flex-1">
                        {stmt.text}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm text-stone-500">{stmt.score1}</span>
                        <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <span className="text-sm font-medium">{stmt.score2}</span>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                          stmt.status === 'improved' ? 'bg-green-500 text-white' :
                          stmt.status === 'declined' ? 'bg-red-500 text-white' :
                          'bg-stone-300 dark:bg-stone-600 text-stone-700 dark:text-stone-300'
                        }`}>
                          {stmt.change > 0 ? '+' : ''}{stmt.change}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Back button */}
              <Button
                variant="secondary"
                onClick={() => {
                  setComparison(null)
                  setSession1(null)
                  setSession2(null)
                }}
                className="w-full"
              >
                {t('adminBack')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
