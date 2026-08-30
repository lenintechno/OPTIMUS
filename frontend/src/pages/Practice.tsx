import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { OptimusLogo } from '../components/brand/OptimusLogo'
import { ConversationHistory } from '../components/practice/ConversationHistory'
import { FeedbackCard } from '../components/practice/FeedbackCard'
import type { PracticeDisplayStatus } from '../components/practice/StatusIndicator'
import { TranscriptBox } from '../components/practice/TranscriptBox'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { buildTutorSpokenText, useSpeechSynthesis } from '../hooks/useSpeechSynthesis'
import { useTutorSession } from '../hooks/useTutorSession'
import { languages, proficiencies, type TutorFeedback } from '../lib/schemas'
import { useProfileStore } from '../stores/profileStore'

export function Practice() {
  const navigate = useNavigate()
  const profile = useProfileStore((state) => state.profile)
  const tutorSession = useTutorSession()
  const language = languages.find((item) => item.value === profile?.target_language)?.label
  const proficiency = proficiencies.find((item) => item.value === profile?.proficiency)?.label
  const isBusy = tutorSession.status === 'starting' || tutorSession.status === 'sending' || tutorSession.status === 'ending'

  const [transcriptText, setTranscriptText] = useState('')
  const lastSpokenFeedbackRef = useRef<TutorFeedback | null>(null)

  const speech = useSpeechRecognition({
    language: profile?.target_language,
    onTranscriptChange: (text) => setTranscriptText(text),
    onFinalTranscript: (text) => setTranscriptText(text),
  })

  const tts = useSpeechSynthesis({
    language: profile?.target_language,
    preferredVoiceName: profile?.preferred_voice,
  })

  // Auto-speak new feedback when returned by the tutor
  useEffect(() => {
    if (tutorSession.feedback && tutorSession.feedback !== lastSpokenFeedbackRef.current) {
      lastSpokenFeedbackRef.current = tutorSession.feedback
      const textToSpeak = buildTutorSpokenText(tutorSession.feedback)
      if (textToSpeak) {
        tts.speak(textToSpeak)
      }
    }
  }, [tutorSession.feedback, tts])

  function handleMicToggle() {
    if (tts.isSpeaking) {
      tts.stop()
    }

    if (speech.status === 'listening') {
      speech.stopListening()
    } else {
      void speech.startListening()
    }
  }

  async function handleSubmit(transcript: string) {
    if (tts.isSpeaking) {
      tts.stop()
    }
    if (speech.status === 'listening') {
      speech.stopListening()
    }
    speech.resetTranscript()
    setTranscriptText('')
    await tutorSession.submit(transcript)
  }

  function handleEndSession() {
    if (tts.isSpeaking) {
      tts.stop()
    }
    if (speech.status === 'listening') {
      speech.stopListening()
    }
    void tutorSession.end().then(() => navigate('/app'))
  }

  if (!profile) return null
  if (!tutorSession.session) {
    return (
      <main className="min-h-[100dvh] bg-[var(--surface)] px-5 py-6 text-[var(--text-primary)] sm:px-8">
        <section className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-2xl flex-col justify-center">
          <button
            className="w-fit inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-cyan-400 uppercase transition-colors hover:text-cyan-300"
            type="button"
            onClick={() => navigate('/app')}
          >
            ← Return to Dashboard
          </button>

          <div className="cyber-card-glow relative mt-8 rounded-3xl p-8 sm:p-10 shadow-2xl border border-indigo-500/35">
            <div className="absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-cyan-400/75 to-transparent" />

            <div className="flex items-center gap-3.5">
              <OptimusLogo size={46} glow={true} />
              <div>
                <p className="text-[11px] font-bold tracking-[0.2em] text-cyan-400 uppercase">
                  NEURAL VOICE & TEXT MATRIX
                </p>
                <span className="font-cyber text-xl font-extrabold text-white tracking-wider">
                  OPTIMUS TUTOR
                </span>
              </div>
            </div>

            <h1 className="font-cyber mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to practice {language}?
            </h1>
            <p className="mt-4 leading-7 text-slate-300">
              Speak into your microphone or type a sentence at your {proficiency?.toLowerCase()} level. OPTIMUS will transcribe your audio, detect grammatical nuances, provide spoken feedback, and guide the dialogue.
            </p>

            {tutorSession.error && (
              <p className="mt-6 rounded-xl border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-300" role="alert">
                {tutorSession.error}
              </p>
            )}

            <button
              className="cyber-btn-primary mt-8 w-full max-w-sm rounded-xl px-6 py-4 text-sm font-extrabold tracking-wider uppercase disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={isBusy}
              onClick={() => void tutorSession.start(profile.target_language, profile.proficiency)}
            >
              {tutorSession.status === 'starting' ? 'Initializing Neural Link…' : 'Start Practice Session →'}
            </button>
          </div>
        </section>
      </main>
    )
  }

  const currentFeedback =
    tutorSession.feedback ??
    [...(tutorSession.detail?.messages ?? [])]
      .reverse()
      .find((message) => message.role === 'tutor')?.structured_feedback

  // Calculate composite display status for the status indicator
  let combinedSpeechStatus: PracticeDisplayStatus = 'idle'
  if (speech.status === 'listening') {
    combinedSpeechStatus = 'listening'
  } else if (speech.status === 'processing') {
    combinedSpeechStatus = 'processing'
  } else if (tts.isSpeaking) {
    combinedSpeechStatus = 'speaking'
  } else if (speech.status === 'error') {
    combinedSpeechStatus = 'error'
  }

  return (
    <main className="min-h-[100dvh] bg-[var(--surface)] px-5 py-6 text-[var(--text-primary)] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        {/* Header with OPTIMUS Logo */}
        <header className="flex items-center justify-between border-b border-slate-800/80 pb-4 pt-2">
          <button
            className="flex items-center gap-3 text-left transition-opacity hover:opacity-90 cursor-pointer"
            type="button"
            onClick={() => {
              tts.stop()
              navigate('/app')
            }}
          >
            <OptimusLogo size={36} glow={true} showWordmark={true} />
          </button>
          <button
            className="rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-2 text-xs font-bold tracking-wider text-slate-300 uppercase transition-all hover:border-rose-500/60 hover:bg-rose-950/30 hover:text-rose-300 disabled:opacity-60 shadow-sm"
            type="button"
            disabled={isBusy}
            onClick={handleEndSession}
          >
            {tutorSession.status === 'ending' ? 'Ending…' : 'End Session'}
          </button>
        </header>

        <section className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,1.1fr)]">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/40 bg-indigo-950/50 px-3.5 py-1 text-xs font-bold tracking-wider text-indigo-300 uppercase shadow-[0_0_10px_rgba(139,92,246,0.2)]">
                Turn {tutorSession.session.turn_count + 1}
              </span>
              <span className="inline-flex items-center rounded-full border border-cyan-500/40 bg-cyan-950/50 px-3.5 py-1 text-xs font-bold tracking-wider text-cyan-300 uppercase shadow-[0_0_10px_rgba(0,212,255,0.2)]">
                {language} · {proficiency}
              </span>
            </div>

            <h1 className="font-cyber mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Speak or write naturally.
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              OPTIMUS is listening to your input and ready to analyze your phrasing.
            </p>

            <div className="mt-6">
              <TranscriptBox
                value={transcriptText}
                onChange={setTranscriptText}
                disabled={isBusy}
                isSending={tutorSession.status === 'sending'}
                speechStatus={combinedSpeechStatus}
                isSpeechSupported={speech.isSupported}
                speechError={speech.error}
                onMicToggle={handleMicToggle}
                onSubmit={handleSubmit}
              />
            </div>

            {tutorSession.error && (
              <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-xs text-rose-300" role="alert">
                {tutorSession.error}
              </p>
            )}

            {currentFeedback && (
              <div className="mt-8">
                <FeedbackCard
                  feedback={currentFeedback}
                  isSpeaking={tts.isSpeaking}
                  isSpeechSupported={tts.isSupported}
                  speechStatus={tts.status}
                  speechError={tts.error}
                  onSpeak={() => tts.speak(buildTutorSpokenText(currentFeedback))}
                  onSpeakSentence={() => currentFeedback.corrected_sentence && tts.speak(currentFeedback.corrected_sentence)}
                  onStop={() => tts.stop()}
                />
              </div>
            )}
          </div>

          <aside className="min-w-0">
            <h2 className="font-cyber text-sm font-extrabold tracking-wider text-slate-200 uppercase">
              Dialogue Stream
            </h2>
            <div className="mt-4">
              <ConversationHistory messages={tutorSession.detail?.messages ?? []} />
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}

