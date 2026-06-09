import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { sanitizeText } from '../lib/validation'
import { Button } from '../components/ui/Button'

export function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function handleSignIn() {
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    const sanitizedEmail = sanitizeText(email)
    const sanitizedPassword = sanitizeText(password)
    setPassword('')
    const { error: err } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password: sanitizedPassword,
    })
    if (err) setError(err.message)
    setLoading(false)
  }

  async function handleSignUp() {
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    const sanitizedEmail = sanitizeText(email)
    const sanitizedPassword = sanitizeText(password)
    setPassword('')
    const { error: err } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password: sanitizedPassword,
    })
    if (err) {
      setError(err.message)
    } else {
      setSuccessMessage('Check your email to confirm your account')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[360px] space-y-6">

        <div className="text-center space-y-1">
          <h1 className="text-hero font-bold text-ink">Fit</h1>
          <p className="text-sm text-muted">Your personal training coach</p>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 border border-border rounded-xl bg-bg px-4 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 border border-border rounded-xl bg-bg px-4 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent"
          />
        </div>

        {error && (
          <p className="text-xs text-danger mt-2">{error}</p>
        )}
        {successMessage && (
          <p className="text-xs text-success mt-2">{successMessage}</p>
        )}

        <div className="space-y-2">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSignIn}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={handleSignUp}
            disabled={loading}
          >
            Create account
          </Button>
        </div>

      </div>
    </div>
  )
}
