import { useCallback, useState } from 'react'

import { apiRequest } from '../lib/api'
import {
  practiceSessionSchema,
  sessionDetailSchema,
  tutorFeedbackSchema,
  type PracticeSession,
  type SessionDetail,
  type TutorFeedback,
} from '../lib/schemas'

type TutorSessionStatus = 'idle' | 'starting' | 'ready' | 'sending' | 'ending' | 'error'

interface UseTutorSessionResult {
  status: TutorSessionStatus
  session: PracticeSession | null
  detail: SessionDetail | null
  feedback: TutorFeedback | null
  error: string | null
  start: (language: PracticeSession['language'], proficiency: PracticeSession['proficiency']) => Promise<void>
  submit: (transcript: string) => Promise<void>
  end: () => Promise<void>
}

export function useTutorSession(): UseTutorSessionResult {
  const [status, setStatus] = useState<TutorSessionStatus>('idle')
  const [session, setSession] = useState<PracticeSession | null>(null)
  const [detail, setDetail] = useState<SessionDetail | null>(null)
  const [feedback, setFeedback] = useState<TutorFeedback | null>(null)
  const [error, setError] = useState<string | null>(null)

  const start = useCallback(async (language: PracticeSession['language'], proficiency: PracticeSession['proficiency']) => {
    setStatus('starting')
    setError(null)
    try {
      const created = practiceSessionSchema.parse(await apiRequest<unknown>('/api/v1/sessions', { method: 'POST', body: JSON.stringify({ language, proficiency }) }))
      setSession(created)
      setDetail({ session: created, messages: [] })
      setFeedback(null)
      setStatus('ready')
    } catch (startError) {
      setStatus('error')
      setError(startError instanceof Error ? startError.message : 'Unable to start a practice session.')
    }
  }, [])

  const submit = useCallback(async (transcript: string) => {
    if (!session || !transcript.trim()) return
    setStatus('sending')
    setError(null)
    try {
      const responseFeedback = tutorFeedbackSchema.parse(await apiRequest<unknown>('/api/v1/tutor/analyze', { method: 'POST', body: JSON.stringify({ session_id: session.id, transcript: transcript.trim() }) }))
      const refreshed = sessionDetailSchema.parse(await apiRequest<unknown>(`/api/v1/sessions/${session.id}`))
      setSession(refreshed.session)
      setDetail(refreshed)
      setFeedback(responseFeedback)
      setStatus('ready')
    } catch (submitError) {
      setStatus('error')
      setError(submitError instanceof Error ? submitError.message : 'The tutor could not review that sentence.')
    }
  }, [session])

  const end = useCallback(async () => {
    if (!session) return
    setStatus('ending')
    setError(null)
    try {
      const ended = practiceSessionSchema.parse(await apiRequest<unknown>(`/api/v1/sessions/${session.id}/end`, { method: 'PATCH' }))
      setSession(ended)
      setDetail((current) => current ? { ...current, session: ended } : current)
      setStatus('ready')
    } catch (endError) {
      setStatus('error')
      setError(endError instanceof Error ? endError.message : 'Unable to end this session.')
    }
  }, [session])

  return { status, session, detail, feedback, error, start, submit, end }
}
