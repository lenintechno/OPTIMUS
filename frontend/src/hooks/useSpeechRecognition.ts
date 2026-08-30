import { useCallback, useEffect, useRef, useState } from 'react'

export type SpeechRecognitionStatus = 'idle' | 'listening' | 'processing' | 'error'

export const BCP47_LANGUAGE_MAP: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  hi: 'hi-IN',
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string
  message?: string
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEventLike) => void) | null
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEventLike) => void) | null
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition)
}

export interface UseSpeechRecognitionOptions {
  language?: string
  onTranscriptChange?: (transcript: string) => void
  onFinalTranscript?: (transcript: string) => void
}

export interface UseSpeechRecognitionResult {
  status: SpeechRecognitionStatus
  isSupported: boolean
  transcript: string
  interimTranscript: string
  error: string | null
  startListening: () => Promise<void>
  stopListening: () => void
  resetTranscript: () => void
  clearError: () => void
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionResult {
  const { language = 'en', onTranscriptChange, onFinalTranscript } = options
  const [status, setStatus] = useState<SpeechRecognitionStatus>('idle')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isSupported = isSpeechRecognitionSupported()
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const onTranscriptChangeRef = useRef(onTranscriptChange)
  const onFinalTranscriptRef = useRef(onFinalTranscript)

  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange
    onFinalTranscriptRef.current = onFinalTranscript
  }, [onTranscriptChange, onFinalTranscript])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      setStatus('processing')
      try {
        recognitionRef.current.stop()
      } catch {
        try {
          recognitionRef.current.abort()
        } catch {
          // Ignore cleanup errors
        }
        setStatus('idle')
      }
    }
  }, [])

  const startListening = useCallback(async () => {
    if (status === 'listening' || status === 'processing') return
    setError(null)

    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. You can type instead.')
      setStatus('idle')
      return
    }

    // 1. Request microphone permission
    try {
      if (navigator?.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((track) => track.stop())
      }
    } catch {
      setError('Microphone access is required to practice speaking.')
      setStatus('idle')
      return
    }

    // 2. Initialize and start SpeechRecognition
    try {
      const win = window as unknown as {
        SpeechRecognition?: SpeechRecognitionConstructor
        webkitSpeechRecognition?: SpeechRecognitionConstructor
      }
      const Constructor = win.SpeechRecognition || win.webkitSpeechRecognition
      if (!Constructor) {
        setError('Speech recognition is not supported in this browser. You can type instead.')
        setStatus('idle')
        return
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // Ignore cleanup error
        }
      }

      const recognition = new Constructor()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = BCP47_LANGUAGE_MAP[language] || 'en-US'

      recognition.onstart = () => {
        setStatus('listening')
        setError(null)
      }

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let interim = ''
        let final = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i]
          if (res.isFinal) {
            final += res[0].transcript
          } else {
            interim += res[0].transcript
          }
        }

        if (interim) {
          setInterimTranscript(interim)
        }

        if (final) {
          const cleanFinal = final.trim()
          setTranscript(cleanFinal)
          setInterimTranscript('')
          onFinalTranscriptRef.current?.(cleanFinal)
        }

        const liveText = (final || interim).trim()
        if (liveText) {
          onTranscriptChangeRef.current?.(liveText)
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        let msg = 'Could not capture speech. Please try again.'
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          msg = 'Microphone access is required to practice speaking.'
        } else if (event.error === 'no-speech') {
          msg = 'I didn’t catch that. Please try again.'
        } else if (event.error === 'network') {
          msg = 'You appear to be offline. Check your connection.'
        }
        setError(msg)
        setStatus('idle')
      }

      recognition.onend = () => {
        setStatus('idle')
        recognitionRef.current = null
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch {
      setError('Could not start microphone recording. Please try again.')
      setStatus('idle')
    }
  }, [isSupported, language, status])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // Ignore cleanup errors on unmount
        }
      }
    }
  }, [])

  return {
    status,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    clearError,
  }
}
