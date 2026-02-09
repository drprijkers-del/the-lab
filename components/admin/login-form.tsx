'use client'

import { useState } from 'react'
import { useSignIn } from '@clerk/nextjs'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

type Step = 'credentials' | 'email-code'

export function LoginForm() {
  const t = useTranslation()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { signIn, isLoaded, setActive } = useSignIn()
  const [step, setStep] = useState<Step>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const unauthorized = searchParams.get('error') === 'unauthorized'
  const redirectTo = searchParams.get('redirect') || '/teams'

  async function handleGoogleLogin() {
    if (!isLoaded || !signIn) return
    setGoogleLoading(true)
    setError(null)

    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/login/sso-callback',
        redirectUrlComplete: redirectTo,
      })
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] }
      setError(clerkError.errors?.[0]?.message || 'Google login failed')
      setGoogleLoading(false)
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded || !signIn) return
    setLoading(true)
    setError(null)

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push(redirectTo)
      } else if (result.status === 'needs_second_factor') {
        // Clerk requires email verification code after password
        await signIn.prepareSecondFactor({ strategy: 'email_code' })
        setStep('email-code')
        setLoading(false)
      } else if (result.status === 'needs_first_factor') {
        // Try password as first factor
        const factorResult = await result.attemptFirstFactor({
          strategy: 'password',
          password,
        })
        if (factorResult.status === 'complete') {
          await setActive({ session: factorResult.createdSessionId })
          router.push(redirectTo)
        } else if (factorResult.status === 'needs_second_factor') {
          await signIn.prepareSecondFactor({ strategy: 'email_code' })
          setStep('email-code')
          setLoading(false)
        } else {
          setError(`Unexpected status: ${factorResult.status}`)
          setLoading(false)
        }
      } else {
        setError(`Unexpected login status: ${result.status}`)
        setLoading(false)
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] }
      setError(clerkError.errors?.[0]?.message || 'Invalid credentials')
      setLoading(false)
    }
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoaded || !signIn) return
    setLoading(true)
    setError(null)

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: 'email_code',
        code: verificationCode,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push(redirectTo)
      } else {
        setError(`Unexpected status: ${result.status}`)
        setLoading(false)
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: { message: string }[] }
      setError(clerkError.errors?.[0]?.message || 'Invalid code')
      setLoading(false)
    }
  }

  // Email verification code step
  if (step === 'email-code') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-1">Check your email</h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              We sent a verification code to <span className="font-medium">{email}</span>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <Input
              id="code"
              type="text"
              label="Verification code"
              placeholder="Enter code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              autoFocus
              autoComplete="one-time-code"
              inputMode="numeric"
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => { setStep('credentials'); setError(null); setVerificationCode('') }}
            className="w-full mt-3 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 py-2 transition-colors"
          >
            Back to login
          </button>
        </CardContent>
      </Card>
    )
  }

  // Credentials step (default)
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-1">{t('loginWelcome')}</h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {t('loginSubtitle')}
          </p>
        </div>

        {unauthorized && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 text-sm">
            <span className="font-medium">Hmm, </span>
            {t('loginUnauthorized')}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || !isLoaded}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 mb-4 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-xl text-sm font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-600 transition-colors disabled:opacity-50"
        >
          {googleLoading ? (
            <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          Continue with Google
        </button>

        {/* Divider */}
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200 dark:border-stone-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white dark:bg-stone-800 px-3 text-stone-400 dark:text-stone-500">or</span>
          </div>
        </div>

        {/* Email + Password Form */}
        <form onSubmit={handlePasswordLogin} className="space-y-4">
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

          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={loading}
          >
            {loading ? t('loginLoading') : 'Sign in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
