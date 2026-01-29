'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

export function LoginForm() {
  const t = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [usePassword, setUsePassword] = useState(false)

  const unauthorized = searchParams.get('error') === 'unauthorized'

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    setLoading(false)

    if (signInError) {
      // Check if rate limited
      if (signInError.message.includes('rate') || signInError.message.includes('limit')) {
        setError('Email rate limit exceeded. Use password login instead.')
        setUsePassword(true)
      } else {
        setError(signInError.message)
      }
      return
    }

    setEmailSent(true)
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      router.push(data.redirect || '/admin/teams')
      router.refresh()
    } catch {
      setError('An error occurred')
      setLoading(false)
    }
  }

  // Success state - email sent
  if (emailSent) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="text-6xl mb-4">📬</div>
          <h2 className="text-xl font-semibold mb-2">{t('loginCheckInbox')}</h2>
          <p className="text-stone-500 mb-6">
            {t('loginEmailSent')}<br />
            <span className="font-medium text-stone-900">{email}</span>
          </p>
          <p className="text-sm text-stone-400 mb-4">
            {t('loginClickLink')}
          </p>
          <button
            onClick={() => setEmailSent(false)}
            className="text-sm text-cyan-600 hover:text-cyan-700 py-2 px-4 min-h-11 rounded-lg hover:bg-cyan-50 transition-colors"
          >
            {t('loginOtherEmail')}
          </button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-stone-900 mb-1">{t('loginWelcome')}</h2>
          <p className="text-sm text-stone-500">
            {t('loginSubtitle')}
          </p>
        </div>

        {unauthorized && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
            <span className="font-medium">Hmm, </span>
            {t('loginUnauthorized')}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={usePassword ? handlePasswordLogin : handleMagicLink} className="space-y-4">
          <Input
            id="email"
            type="email"
            label={t('loginEmail')}
            placeholder={t('loginEmailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />

          {usePassword && (
            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={loading}
          >
            {loading ? t('loginLoading') : (usePassword ? 'Sign in' : t('loginButton'))}
          </Button>
        </form>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => setUsePassword(!usePassword)}
            className="text-sm text-cyan-600 hover:text-cyan-700 py-2 px-4 min-h-11 rounded-lg hover:bg-cyan-50 transition-colors"
          >
            {usePassword ? 'Use magic link instead' : 'Have a password? Sign in with password'}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
