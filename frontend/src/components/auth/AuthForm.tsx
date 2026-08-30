import { type FormEvent, useState } from 'react'

interface AuthFormProps {
  mode: 'login' | 'signup'
  onSubmit: (email: string, password: string) => Promise<string | null>
}

export function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSignup = mode === 'signup'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    if (isSignup && password.length < 8) {
      setMessage('Use a password with at least 8 characters.')
      return
    }
    setIsSubmitting(true)
    const result = await onSubmit(email.trim(), password)
    setIsSubmitting(false)
    if (result) setMessage(result)
  }

  return (
    <form className="mt-8 grid gap-5" onSubmit={submit} noValidate>
      <label className="grid gap-2 text-xs font-semibold tracking-wider text-slate-300 uppercase" htmlFor="email">
        Email Address
        <input
          id="email"
          className="rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-3 text-base text-white outline-none transition-all placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-900/90 focus:shadow-[0_0_15px_rgba(0,212,255,0.25)]"
          type="email"
          autoComplete="email"
          placeholder="learner@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      <label className="grid gap-2 text-xs font-semibold tracking-wider text-slate-300 uppercase" htmlFor="password">
        Password
        <input
          id="password"
          className="rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-3 text-base text-white outline-none transition-all placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-900/90 focus:shadow-[0_0_15px_rgba(0,212,255,0.25)]"
          type="password"
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={isSignup ? 8 : undefined}
          required
        />
      </label>

      {message && (
        <p
          className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-xs font-medium leading-5 text-rose-300"
          role="status"
        >
          {message}
        </p>
      )}

      <button
        className="cyber-btn-primary mt-2 flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold tracking-wider uppercase transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Authenticating…</span>
          </>
        ) : isSignup ? (
          'Create Account'
        ) : (
          'Sign In to OPTIMUS'
        )}
      </button>
    </form>
  )
}
