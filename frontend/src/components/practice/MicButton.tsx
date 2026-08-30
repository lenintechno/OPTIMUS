import type { SpeechRecognitionStatus } from '../../hooks/useSpeechRecognition'

interface MicButtonProps {
  status: SpeechRecognitionStatus
  disabled?: boolean
  onClick: () => void
}

export function MicButton({ status, disabled = false, onClick }: MicButtonProps) {
  const isListening = status === 'listening'
  const isProcessing = status === 'processing'

  const label = isListening
    ? 'Stop recording'
    : isProcessing
      ? 'Processing speech…'
      : 'Start voice recording'

  return (
    <button
      type="button"
      className={`relative inline-flex h-14 w-14 items-center justify-center rounded-2xl transition-all focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 ${
        isListening
          ? 'bg-gradient-to-br from-rose-500 via-red-600 to-red-700 text-white shadow-[0_0_25px_rgba(239,68,68,0.6)] border border-rose-400'
          : isProcessing
            ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white border border-cyan-400 shadow-[0_0_20px_rgba(0,212,255,0.4)]'
            : 'border border-cyan-500/30 bg-slate-900/80 text-cyan-400 shadow-[0_0_15px_rgba(0,212,255,0.15)] hover:border-cyan-400 hover:bg-cyan-950/40 hover:text-cyan-200 hover:shadow-[0_0_25px_rgba(0,212,255,0.35)] active:scale-95'
      }`}
      disabled={disabled || isProcessing}
      onClick={onClick}
      aria-label={label}
      aria-pressed={isListening}
    >
      {isListening && (
        <span
          className="absolute inset-0 -z-10 animate-ping rounded-2xl bg-rose-500/40 duration-1000"
          aria-hidden="true"
        />
      )}
      {isProcessing ? (
        <svg className="h-6 w-6 animate-spin text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : isListening ? (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      )}
    </button>
  )
}
