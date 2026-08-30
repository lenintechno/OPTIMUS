import { Link, Navigate, useNavigate } from 'react-router-dom'

import { AuthForm } from '../components/auth/AuthForm'
import { useAuthStore } from '../stores/authStore'
import { AuthPage, ConfigurationMessage } from './Login'

export function Signup() {
  const navigate = useNavigate()
  const { status, error, signUp } = useAuthStore()
  if (status === 'authenticated') return <Navigate to="/app" replace />

  return (
    <AuthPage
      title="Initialize your voice"
      subtitle="VOICE LEARNING MATRIX"
      description="Create your OPTIMUS account to begin intelligent language practice."
    >
      {status === 'configuration-error' ? (
        <ConfigurationMessage message={error} />
      ) : (
        <AuthForm
          mode="signup"
          onSubmit={async (email, password) => {
            const result = await signUp(email, password)
            if (!result) navigate('/app')
            return result
          }}
        />
      )}
      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        Already have an account?{' '}
        <Link className="font-semibold text-cyan-400 transition-colors hover:text-cyan-300 hover:underline" to="/login">
          Sign in
        </Link>
        .
      </p>
    </AuthPage>
  )
}

