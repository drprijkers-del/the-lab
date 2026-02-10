'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { AdminHeader } from '@/components/admin/header'

// Generate random math challenge
function generateMathChallenge() {
  const num1 = Math.floor(Math.random() * 10) + 1 // 1-10
  const num2 = Math.floor(Math.random() * 10) + 1 // 1-10
  return { num1, num2, answer: num1 + num2 }
}

export default function ContactPage() {
  const t = useTranslation()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [team, setTeam] = useState('')
  const [message, setMessage] = useState('')
  const [captchaInput, setCaptchaInput] = useState('')
  const [honeypot, setHoneypot] = useState('') // Spam protection - should remain empty
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadTime] = useState(Date.now()) // Track when form was loaded

  // Generate math challenge once on mount
  const mathChallenge = useMemo(() => generateMathChallenge(), [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Honeypot check - if filled, it's likely a bot
    if (honeypot) {
      // Silently "succeed" to not reveal bot detection
      setSubmitted(true)
      return
    }

    // Time check - if submitted too quickly (< 3 seconds), likely a bot
    if (Date.now() - loadTime < 3000) {
      setError(t('contactError'))
      return
    }

    // CAPTCHA check
    if (parseInt(captchaInput, 10) !== mathChallenge.answer) {
      setError(t('contactCaptchaError'))
      return
    }

    if (!name.trim() || !email.trim() || !message.trim()) {
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          team: team.trim(),
          message: message.trim(),
          _timestamp: loadTime,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to send')
      }

      setSubmitted(true)
    } catch {
      setError(t('contactError'))
    } finally {
      setSubmitting(false)
    }
  }

  // Success state
  if (submitted) {
    return (
      <>
        <AdminHeader />
        <main className="max-w-lg mx-auto px-4 pt-12 pb-24">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
              {t('contactSuccess')}
            </h1>
            <p className="text-stone-600 dark:text-stone-400 mb-8">
              {t('contactSuccessMessage')}
            </p>
            <Button variant="secondary" onClick={() => router.back()}>
              {t('contactBackToTeams')}
            </Button>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <AdminHeader />
      <main className="max-w-lg mx-auto px-4 pt-8 pb-24">
        {/* Back link */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 mb-6 min-h-11 py-2"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('adminBack')}
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="w-12 h-12 mb-4 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{t('contactTitle')}</h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">{t('contactSubtitle')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Honeypot field - hidden from users, bots will fill it */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              type="text"
              id="website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              {t('contactNameLabel')} *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('contactNamePlaceholder')}
              required
              className="w-full px-4 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              {t('contactEmailLabel')} *
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('contactEmailPlaceholder')}
              required
              className="w-full px-4 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="team" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              {t('contactTeamLabel')}
            </label>
            <input
              type="text"
              id="team"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder={t('contactTeamPlaceholder')}
              className="w-full px-4 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              {t('contactMessageLabel')} *
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('contactMessagePlaceholder')}
              required
              rows={5}
              className="w-full px-4 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Math CAPTCHA */}
          <div>
            <label htmlFor="captcha" className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              {t('contactCaptchaLabel')} *
            </label>
            <div className="flex items-center gap-3">
              <div className="px-4 py-3 bg-stone-100 dark:bg-stone-700 rounded-xl text-stone-900 dark:text-stone-100 font-mono text-lg select-none">
                {mathChallenge.num1} + {mathChallenge.num2} =
              </div>
              <input
                type="number"
                id="captcha"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="?"
                required
                className="w-24 px-4 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-center text-lg"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            loading={submitting}
            disabled={!name.trim() || !email.trim() || !message.trim() || !captchaInput}
            className="w-full"
          >
            {submitting ? t('contactSending') : t('contactSend')}
          </Button>
        </form>
      </main>
    </>
  )
}
