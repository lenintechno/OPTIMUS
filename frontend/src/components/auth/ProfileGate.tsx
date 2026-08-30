import { type ReactNode, useEffect } from 'react'
import { Navigate } from 'react-router-dom'

import { OptimusLogo } from '../brand/OptimusLogo'
import { useAuthStore } from '../../stores/authStore'
import { useProfileStore } from '../../stores/profileStore'

export function ProfileGate({ children, requiresProfile }: { children: ReactNode; requiresProfile: boolean }) {
  const user = useAuthStore((state) => state.user)
  const { status, profile, userId, error, load } = useProfileStore()

  useEffect(() => {
    if (user && userId !== user.id) void load(user.id)
  }, [load, user, userId])

  if (!user || userId !== user.id || status === 'idle' || status === 'loading') return <ProfileLoading />
  if (status === 'error') {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-[var(--surface)] px-5 text-[var(--text-primary)]">
        <section className="cyber-card-glow max-w-md rounded-3xl p-8">
          <OptimusLogo size={40} glow={true} />
          <h1 className="font-cyber mt-4 text-xl font-bold text-white">We could not load your profile.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">{error}</p>
          <button
            className="cyber-btn-primary mt-6 rounded-xl px-5 py-2.5 text-xs font-bold tracking-wider uppercase"
            type="button"
            onClick={() => void load(user.id)}
          >
            Try Again
          </button>
        </section>
      </main>
    )
  }
  if (requiresProfile && !profile) return <Navigate to="/onboarding" replace />
  if (!requiresProfile && profile) return <Navigate to="/app" replace />
  return <>{children}</>
}

function ProfileLoading() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-[var(--surface)] text-slate-300">
      <OptimusLogo size={64} glow={true} />
      <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-cyan-400 uppercase">
        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
        Syncing Neural Profile…
      </div>
    </main>
  )
}
