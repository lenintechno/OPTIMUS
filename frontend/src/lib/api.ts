import { isSupabaseConfigured, supabase } from './supabase'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '')

interface ApiEnvelope<T> {
  success: boolean
  data: T
  error: string | null
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function accessToken() {
  if (!isSupabaseConfigured || !supabase) throw new ApiError('Supabase is not configured for this environment.', 503)
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session?.access_token) throw new ApiError('Your session has expired. Please sign in again.', 401)
  return data.session.access_token
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json', ...init.headers },
  })
  const payload = await response.json().catch(() => null) as ApiEnvelope<T> | { detail?: string } | null
  if (!response.ok) {
    const message = payload && 'detail' in payload && typeof payload.detail === 'string' ? payload.detail : 'Unable to complete that request. Please try again.'
    throw new ApiError(message, response.status)
  }
  if (!payload || !('success' in payload) || !payload.success) throw new ApiError('The server returned an unexpected response.', response.status)
  return payload.data
}
