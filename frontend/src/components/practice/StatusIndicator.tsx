import type { SpeechRecognitionStatus } from '../../hooks/useSpeechRecognition'

export type PracticeDisplayStatus = SpeechRecognitionStatus | 'speaking'

interface StatusIndicatorProps {
  status: PracticeDisplayStatus
  customLabel?: string
}

export function StatusIndicator({ status, customLabel }: StatusIndicatorProps) {
  const config = {
    idle: {
      dotColor: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]',
      label: customLabel ?? 'Ready for speech or text input',
    },
    listening: {
      dotColor: 'bg-rose-500 animate-ping shadow-[0_0_12px_rgba(244,63,94,0.9)]',
      label: customLabel ?? 'Listening… Speak clearly into your microphone',
    },
    processing: {
      dotColor: 'bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.9)]',
      label: customLabel ?? 'Processing neural transcription…',
    },
    speaking: {
      dotColor: 'bg-cyan-400 animate-pulse shadow-[0_0_12px_rgba(0,212,255,0.9)]',
      label: customLabel ?? 'OPTIMUS is speaking audio feedback…',
    },
    error: {
      dotColor: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]',
      label: customLabel ?? 'Microphone access required',
    },
  }[status]

  return (
    <div
      className="inline-flex items-center gap-2.5 rounded-full border border-slate-700/80 bg-slate-900/80 px-3.5 py-1.5 text-xs font-semibold text-slate-300 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <span className={`h-2 w-2 rounded-full ${config.dotColor}`} aria-hidden="true" />
      <span>{config.label}</span>
    </div>
  )
}
