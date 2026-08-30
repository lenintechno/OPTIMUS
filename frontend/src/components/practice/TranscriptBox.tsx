import type { FormEvent } from 'react'

import { MicButton } from './MicButton'
import { StatusIndicator, type PracticeDisplayStatus } from './StatusIndicator'

interface TranscriptBoxProps {
  value: string
  onChange: (value: string) => void
  disabled: boolean
  isSending: boolean
  onSubmit: (transcript: string) => Promise<void>
  speechStatus?: PracticeDisplayStatus
  isSpeechSupported?: boolean
  speechError?: string | null
  onMicToggle?: () => void
}

export function TranscriptBox({
  value,
  onChange,
  disabled,
  isSending,
  onSubmit,
  speechStatus = 'idle',
  isSpeechSupported = true,
  speechError = null,
  onMicToggle,
}: TranscriptBoxProps) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalized = value.trim()
    if (!normalized || disabled || isSending) return
    await onSubmit(normalized)
  }

  const isBusy = disabled || isSending
  const isMicrophoneListening = speechStatus === 'listening'
  const isMicrophoneProcessing = speechStatus === 'processing'
  const micButtonStatus = isMicrophoneListening ? 'listening' : isMicrophoneProcessing ? 'processing' : 'idle'

  return (
    <form
      className="cyber-card-glow relative rounded-3xl p-6 shadow-xl backdrop-blur-xl transition-all"
      onSubmit={submit}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <StatusIndicator status={speechStatus} />
        {!isSpeechSupported && (
          <p className="text-xs font-medium text-slate-400" role="note">
            Speech recognition not detected. You can type instead.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {onMicToggle && isSpeechSupported && (
          <div className="flex shrink-0 items-center justify-center pt-1">
            <MicButton
              status={micButtonStatus}
              disabled={isBusy}
              onClick={onMicToggle}
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor="practice-transcript">
            Your sentence
          </label>
          <textarea
            id="practice-transcript"
            className="min-h-28 w-full resize-y bg-transparent text-base leading-7 text-white outline-none placeholder:text-slate-500 focus:placeholder:text-slate-400"
            placeholder={
              isSpeechSupported
                ? 'Speak with your microphone or type a practice sentence here…'
                : 'Type a practice sentence here…'
            }
            value={value}
            onChange={(event) => onChange(event.target.value)}
            maxLength={500}
            disabled={isBusy}
          />
        </div>
      </div>

      {speechError && (
        <p className="mt-3 rounded-xl border border-rose-500/30 bg-rose-950/30 px-3.5 py-2.5 text-xs text-rose-300" role="alert">
          {speechError}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-800/80 pt-4">
        <span className="text-xs font-mono text-slate-400">{value.length}/500</span>
        <div className="flex items-center gap-2">
          {value && (
            <button
              type="button"
              className="rounded-xl border border-slate-700/80 bg-slate-900/50 px-3 py-2 text-xs font-semibold text-slate-400 uppercase transition-colors hover:border-slate-600 hover:text-white disabled:opacity-50"
              disabled={isBusy}
              onClick={() => onChange('')}
            >
              Clear
            </button>
          )}
          <button
            className="cyber-btn-primary rounded-xl px-5 py-2.5 text-sm font-bold tracking-wider uppercase disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            disabled={!value.trim() || isBusy}
          >
            {isSending ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing Phrasing…
              </span>
            ) : (
              'Send Sentence →'
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
