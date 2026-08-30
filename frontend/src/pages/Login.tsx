import type { ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { OptimusLogo } from '../components/brand/OptimusLogo'
import { AuthForm } from '../components/auth/AuthForm'
import { useAuthStore } from '../stores/authStore'

export function Login() {
  const navigate = useNavigate()
  const { status, error, signIn } = useAuthStore()
  if (status === 'authenticated') return <Navigate to="/app" replace />

  return (
    <AuthPage
      title="Welcome back"
      subtitle="NEURAL TUTOR INTERFACE"
      description="Power on your voice practice session and continue mastering your language."
    >
      {status === 'configuration-error' ? (
        <ConfigurationMessage message={error} />
      ) : (
        <AuthForm
          mode="login"
          onSubmit={async (email, password) => {
            const result = await signIn(email, password)
            if (!result) navigate('/app')
            return result
          }}
        />
      )}
      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        New to OPTIMUS?{' '}
        <Link className="font-semibold text-cyan-400 transition-colors hover:text-cyan-300 hover:underline" to="/signup">
          Create an account
        </Link>
        .
      </p>
    </AuthPage>
  )
}

export function AuthPage({
  title,
  subtitle = 'NEURAL LANGUAGE TUTOR',
  description,
  children,
}: {
  title: string
  subtitle?: string
  description: string
  children: ReactNode
}) {
  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-1/4 left-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute top-1/3 left-1/3 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 h-88 w-88 rounded-full bg-rose-600/15 blur-3xl" />
      </div>

      <section className="cyber-card-glow w-full max-w-md rounded-3xl p-7 sm:p-9 shadow-2xl border border-indigo-500/40 relative">
        {/* Top edge metallic highlight */}
        <div className="absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent" />

        {/* Prominent OPTIMUS Brand Header */}
        <div className="flex flex-col items-center text-center">
          <Link
            className="group flex flex-col items-center transition-transform active:scale-95"
            to="/login"
            aria-label="OPTIMUS Home"
          >
            <OptimusLogo size={70} glow={true} />
            <span className="font-cyber mt-3.5 text-2xl sm:text-3xl font-extrabold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 drop-shadow-[0_2px_14px_rgba(56,189,248,0.5)]">
              OPTIMUS
            </span>
          </Link>

          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-[11px] font-bold tracking-[0.2em] text-cyan-300 uppercase shadow-[0_0_12px_rgba(0,212,255,0.15)]">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            {subtitle}
          </div>

          <h1 className="font-cyber mt-6 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
        </div>

        {children}
      </section>
    </main>
  )
}

export function ConfigurationMessage({ message }: { message: string | null }) {
  return (
    <p
      className="mt-8 rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-sm leading-6 text-rose-300"
      role="alert"
    >
      {message} Add the public Vite values from `frontend/.env.example`, then restart the development server.
    </p>
  )
}

