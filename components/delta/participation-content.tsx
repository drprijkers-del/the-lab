'use client'

import { useState, useEffect } from 'react'
import { submitResponse, hasResponded } from '@/domain/delta/actions'
import { getStatements } from '@/domain/delta/statements'
import { DeltaAngle, getAngleInfo, ResponseAnswers, Statement } from '@/domain/delta/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n/context'
import { v4 as uuidv4 } from 'uuid'

interface ParticipationContentProps {
  sessionId: string
  sessionCode: string
  teamName: string
  angle: DeltaAngle
  title: string | null
}

type ViewState = 'loading' | 'intro' | 'statements' | 'submitting' | 'done' | 'already_responded'

export function ParticipationContent({
  sessionId,
  sessionCode,
  teamName,
  angle,
  title,
}: ParticipationContentProps) {
  const t = useTranslation()
  const [viewState, setViewState] = useState<ViewState>('loading')
  const [statements, setStatements] = useState<Statement[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<ResponseAnswers>({})
  const [deviceId, setDeviceId] = useState<string>('')

  const angleInfo = getAngleInfo(angle)

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      // Get or create device ID
      let storedDeviceId = localStorage.getItem('delta_device_id')
      if (!storedDeviceId) {
        storedDeviceId = uuidv4()
        localStorage.setItem('delta_device_id', storedDeviceId)
      }
      setDeviceId(storedDeviceId)

      // Check if already responded
      const alreadyDone = await hasResponded(sessionId, storedDeviceId)
      if (alreadyDone) {
        setViewState('already_responded')
        return
      }

      // Load statements
      const stmts = getStatements(angle)
      setStatements(stmts)
      setViewState('intro')
    }

    init()
  }, [sessionId, angle])

  function handleStart() {
    setViewState('statements')
  }

  function handleAnswer(score: number) {
    const statement = statements[currentIndex]
    setAnswers(prev => ({ ...prev, [statement.id]: score }))

    if (currentIndex < statements.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      handleSubmit({ ...answers, [statement.id]: score })
    }
  }

  function handleBack() {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  async function handleSubmit(finalAnswers: ResponseAnswers) {
    setViewState('submitting')

    const result = await submitResponse(sessionId, deviceId, finalAnswers)

    if (result.alreadyResponded) {
      setViewState('already_responded')
    } else if (result.success) {
      setViewState('done')
    } else {
      // On error, go back to last statement
      setViewState('statements')
    }
  }

  // Loading state
  if (viewState === 'loading') {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center">
        <div className="text-5xl font-bold text-cyan-500 animate-pulse">Δ</div>
      </div>
    )
  }

  // Already responded
  if (viewState === 'already_responded') {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">{t('alreadyResponded')}</h1>
            <p className="text-stone-500 dark:text-stone-400">
              {t('alreadyRespondedMessage')}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Intro screen
  if (viewState === 'intro') {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <div className="text-sm text-cyan-600 dark:text-cyan-400 font-medium mb-2">{t('deltaSession')}</div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">{teamName}</h1>
            <p className="text-stone-500 dark:text-stone-400 mb-8">{title || angleInfo.label}</p>

            <div className="text-left bg-stone-50 dark:bg-stone-700 rounded-xl p-4 mb-8">
              <div className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">{t('howItWorks')}</div>
              <ul className="text-sm text-stone-600 dark:text-stone-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500 mt-0.5">•</span>
                  <span>{statements.length} {t('statementsHonest')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500 mt-0.5">•</span>
                  <span>{t('rateStatement')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-500 mt-0.5">•</span>
                  <span>{t('responsesAnonymous')}</span>
                </li>
              </ul>
            </div>

            <Button onClick={handleStart} className="w-full">
              {t('start')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Statements flow
  if (viewState === 'statements' || viewState === 'submitting') {
    const statement = statements[currentIndex]
    const progress = ((currentIndex) / statements.length) * 100

    // Score button colors - subtle gradient from red to green
    const getScoreButtonClass = (score: number) => {
      const baseClass = "flex-1 aspect-square rounded-xl text-white text-xl sm:text-2xl font-bold transition-colors disabled:opacity-50"
      const colors = [
        'bg-red-800/50 hover:bg-red-700 active:bg-red-600',
        'bg-orange-800/50 hover:bg-orange-700 active:bg-orange-600',
        'bg-amber-800/50 hover:bg-amber-700 active:bg-amber-600',
        'bg-emerald-800/50 hover:bg-emerald-700 active:bg-emerald-600',
        'bg-green-800/50 hover:bg-green-700 active:bg-green-600',
      ]
      return `${baseClass} ${colors[score - 1]}`
    }

    return (
      <div className="min-h-screen bg-stone-900 flex flex-col">
        {/* Progress bar */}
        <div className="h-1 bg-stone-800">
          <div
            className="h-full bg-cyan-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentIndex === 0 || viewState === 'submitting'}
            className="w-11 h-11 min-w-11 min-h-11 rounded-full flex items-center justify-center text-stone-500 hover:text-white hover:bg-stone-800 active:bg-stone-700 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-stone-500"
            aria-label="Vorige"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-stone-500 text-sm">
            {currentIndex + 1} {t('of')} {statements.length}
          </div>
          <div className="w-11" /> {/* Spacer for alignment */}
        </div>

        {/* Statement */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg w-full">
            <p className="text-white text-xl sm:text-2xl font-medium text-center leading-relaxed">
              &ldquo;{statement.text}&rdquo;
            </p>
          </div>
        </div>

        {/* Answer buttons */}
        <div className="p-6 pb-12">
          <div className="max-w-lg mx-auto">
            <div className="flex justify-between text-stone-500 text-sm mb-3 px-2">
              <span>{t('disagree')}</span>
              <span>{t('agree')}</span>
            </div>
            <div className="flex gap-2 sm:gap-3">
              {[1, 2, 3, 4, 5].map(score => (
                <button
                  key={score}
                  onClick={() => handleAnswer(score)}
                  disabled={viewState === 'submitting'}
                  className={getScoreButtonClass(score)}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Done
  if (viewState === 'done') {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">{t('thankYou')}</h1>
            <p className="text-stone-500 dark:text-stone-400">
              {t('responseRecorded')}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
