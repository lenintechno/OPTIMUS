import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'

import { isSupabaseConfigured, supabase } from '../lib/supabase'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'configuration-error'

interface AuthState {
  status: AuthStatus
  user: User | null
  error: string | null
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

let subscriptionStarted = false

function stateFromSession(session: Session | null) {
  return { status: session ? ('authenticated' as const) : ('unauthenticated' as const), user: session?.user ?? null, error: null }
}

function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const err = error as { status?: number; code?: string; message?: string }
  if (err.status === 429) return true
  if (err.code === 'over_email_send_rate_limit' || err.code === 'over_request_rate_limit' || err.code === 'rate_limit') return true
  if (typeof err.message === 'string') {
    const msg = err.message.toLowerCase()
    return msg.includes('rate limit') || msg.includes('too many') || msg.includes('429')
  }
  return false
}

export const useAuthStore = create<AuthState>((set) => ({
  status: isSupabaseConfigured ? 'loading' : 'configuration-error',
  user: null,
  error: isSupabaseConfigured ? null : 'Supabase is not configured for this environment.',
  initialize: async () => {
    if (!supabase) return
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      set({ status: 'unauthenticated', user: null, error: 'Unable to restore your session. Please sign in again.' })
      return
    }
    set(stateFromSession(data.session))
    if (!subscriptionStarted) {
      subscriptionStarted = true
      supabase.auth.onAuthStateChange((_event, session) => set(stateFromSession(session)))
    }
  },
  signIn: async (email, password) => {
    if (!supabase) return 'Supabase is not configured for this environment.'
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return 'Unable to sign in with those credentials.'
    set(stateFromSession(data.session))
    return null
  },
  signUp: async (email, password) => {
    if (!supabase) return 'Supabase is not configured for this environment.'
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
    if (error) {
      if (isRateLimitError(error)) {
        return 'Too many signup attempts. Please wait a few minutes and try again.'
      }
      return 'Unable to create an account. Please review your details and try again.'
    }
    if (data.session) set(stateFromSession(data.session))
    return data.session ? null : 'Check your inbox to confirm your email, then return here to sign in.'
  },
  signOut: async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    set(stateFromSession(null))
  },
}))
