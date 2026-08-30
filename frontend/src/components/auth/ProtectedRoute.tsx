import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuthStore } from '../../stores/authStore'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status)
  if (status === 'loading') return <main className="grid min-h-[100dvh] place-items-center bg-[var(--surface)] text-[var(--text-muted)]">Restoring your session...</main>
  if (status !== 'authenticated') return <Navigate to="/login" replace />
  return <>{children}</>
}
