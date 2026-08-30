import type { SpeechSynthesisStatus } from '../../hooks/useSpeechSynthesis'
import type { TutorFeedback } from '../../lib/schemas'

interface FeedbackCardProps {
  feedback: TutorFeedback
  isSpeaking?: boolean
  isSpeechSupported?: boolean
  speechStatus?: SpeechSynthesisStatus
  speechError?: string | null
  onSpeak?: () => void
  onSpeakSentence?: () => void
  onStop?: () => void
}

export function FeedbackCard({
  feedback,
  isSpeaking = false,
  isSpeechSupported = true,
  speechStatus = 'idle',
  speechError = null,
  onSpeak,
  onSpeakSentence,
  onStop,
}: FeedbackCardProps) {
  const isPlaying = isSpeaking || speechStatus === 'speaking'
  const isAudioLoading = speechStatus === 'loading'

  return (
    <section
      className="cyber-card-glow relative rounded-3xl p-6 sm:p-7 shadow-2xl border border-indigo-500/35"
      aria-label="Tutor feedback"
    >
      <div className="absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-950/50 px-3.5 py-1 text-[11px] font-extrabold tracking-[0.2em] text-cyan-300 uppercase shadow-[0_0_15px_rgba(0,212,255,0.25)]">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            OPTIMUS FEEDBACK
          </span>
          {isPlaying && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/40 bg-indigo-950/70 px-3 py-1 text-[11px] font-semibold text-indigo-300 shadow-[0_0_12px_rgba(139,92,246,0.3)]"
              role="status"
              aria-live="polite"
            >
              <span className="flex h-2 items-center gap-0.5">
                <span className="h-2.5 w-0.5 animate-pulse bg-cyan-400" />
                <span className="h-1.5 w-0.5 animate-pulse bg-indigo-400" style={{ animationDelay: '150ms' }} />
                <span className="h-3 w-0.5 animate-pulse bg-cyan-400" style={{ animationDelay: '300ms' }} />
              </span>
              Speaking…
            </span>
          )}
        </div>

        {isSpeechSupported && (onSpeak || onStop) && (
          <div className="flex items-center gap-2">
            {isPlaying ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/50 bg-rose-950/50 px-4 py-2 text-xs font-extrabold tracking-wider text-rose-300 uppercase shadow-[0_0_18px_rgba(239,68,68,0.3)] transition-all hover:bg-rose-900/70 hover:border-rose-400"
                onClick={onStop}
                aria-label="Stop audio playback"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
                <span>Stop Audio</span>
              </button>
            ) : (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-slate-900/80 px-4 py-2 text-xs font-extrabold tracking-wider text-cyan-300 uppercase shadow-xs transition-all hover:border-cyan-400 hover:bg-cyan-950/40 hover:shadow-[0_0_18px_rgba(0,212,255,0.3)] disabled:opacity-50"
                onClick={onSpeak}
                disabled={isAudioLoading}
                aria-label={speechStatus === 'stopped' ? 'Replay tutor response' : 'Listen to tutor response'}
              >
                {isAudioLoading ? (
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
                <span>{speechStatus === 'stopped' ? 'Replay Audio' : 'Listen to Tutor'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-start gap-2">
        <p className="font-cyber text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
          {feedback.corrected_sentence}
        </p>
        {isSpeechSupported && onSpeakSentence && (
          <button
            type="button"
            className="mt-1 inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-900/80 p-2 text-cyan-400 transition-all hover:border-cyan-400 hover:bg-cyan-950/50 hover:text-cyan-300 hover:shadow-[0_0_12px_rgba(0,212,255,0.25)]"
            onClick={onSpeakSentence}
            title="Hear sentence pronunciation"
            aria-label="Hear corrected sentence pronunciation"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </button>
        )}
      </div>

      <p className="mt-4 leading-7 text-slate-300">{feedback.explanation}</p>

      {speechError && (
        <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-950/30 px-3.5 py-2 text-xs text-rose-300" role="alert">
          {speechError}
        </p>
      )}

      {feedback.grammar_issues.length > 0 && (
        <section className="mt-6">
          <h2 className="font-cyber text-xs font-bold tracking-wider text-slate-400 uppercase">Grammar Notes</h2>
          <ul className="mt-3 grid gap-3">
            {feedback.grammar_issues.map((issue, index) => (
              <li
                className="cyber-card rounded-2xl p-4 text-sm border border-cyan-500/20"
                key={`${issue.type}-${index}`}
              >
                <p className="font-semibold text-white">
                  <span className="text-indigo-300">{issue.type}:</span>{' '}
                  <span className="text-rose-400 line-through opacity-85">{issue.original}</span> →{' '}
                  <span className="text-cyan-300 font-bold">{issue.correction}</span>
                </p>
                <p className="mt-1.5 leading-6 text-slate-400">{issue.explanation}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {feedback.vocabulary_suggestions.length > 0 && (
        <section className="mt-6">
          <h2 className="font-cyber text-xs font-bold tracking-wider text-slate-400 uppercase">More Natural Wording</h2>
          <ul className="mt-3 grid gap-3">
            {feedback.vocabulary_suggestions.map((suggestion, index) => (
              <li
                className="cyber-card rounded-2xl p-3.5 text-sm leading-6 text-slate-300 border border-indigo-500/20"
                key={`${suggestion.original}-${index}`}
              >
                <span className="font-bold text-cyan-300">{suggestion.suggestion}</span>{' '}
                instead of “<span className="text-slate-400">{suggestion.original}</span>” — {suggestion.why}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 grid gap-4 border-t border-slate-800/80 pt-5 sm:grid-cols-2">
        <div className="cyber-card rounded-2xl p-4 border border-cyan-500/20">
          <span className="font-cyber text-xs font-bold tracking-wider text-cyan-400 uppercase">Natural Alternative</span>
          <p className="mt-1.5 text-sm leading-6 text-slate-200">{feedback.natural_alternative}</p>
        </div>
        <div className="cyber-card rounded-2xl p-4 border border-indigo-500/20">
          <span className="font-cyber text-xs font-bold tracking-wider text-indigo-400 uppercase">Follow-up Question</span>
          <p className="mt-1.5 text-sm leading-6 text-slate-200">{feedback.follow_up_question}</p>
        </div>
      </div>

      <p className="mt-5 text-sm font-semibold text-cyan-400">{feedback.encouragement}</p>
    </section>
  )
}

