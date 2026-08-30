import { useCallback, useEffect, useRef, useState } from 'react'

import { BCP47_LANGUAGE_MAP } from './useSpeechRecognition.ts'
import type { TutorFeedback } from '../lib/schemas.ts'

export type SpeechSynthesisStatus = 'idle' | 'loading' | 'speaking' | 'stopped' | 'error'

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window)
}

export function buildTutorSpokenText(feedback: TutorFeedback): string {
  const parts: string[] = []
  if (feedback.corrected_sentence?.trim()) {
    parts.push(feedback.corrected_sentence.trim())
  }
  if (feedback.explanation?.trim()) {
    parts.push(feedback.explanation.trim())
  }
  if (feedback.follow_up_question?.trim()) {
    parts.push(feedback.follow_up_question.trim())
  }
  return parts.join(' ')
}

const MALE_VOICE_NAMES = [
  'david',
  'guy',
  'alex',
  'daniel',
  'george',
  'ryan',
  'mark',
  'eric',
  'roger',
  'steffan',
  'christopher',
  'arthur',
  'oliver',
  'aaron',
  'nathan',
  'tom',
  'lee',
  'fred',
  'brian',
  'matthew',
  'rishi',
  'alva',
]

export function isMaleVoice(voice: SpeechSynthesisVoice): boolean {
  const name = voice.name.toLowerCase()
  if (/\b(male|man|boy)\b/i.test(name) || name.includes('(male)')) {
    return true
  }
  return MALE_VOICE_NAMES.some((m) => new RegExp(`\\b${m}\\b`, 'i').test(name))
}

export function selectMatchingVoice(
  voices: SpeechSynthesisVoice[],
  language?: string,
  preferredVoiceName?: string | null
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null

  // 1. Exact preferred voice name match (user/profile setting)
  if (preferredVoiceName) {
    const matchedPreferred = voices.find(
      (v) => v.name.toLowerCase() === preferredVoiceName.toLowerCase()
    )
    if (matchedPreferred) return matchedPreferred
  }

  if (!language) return voices[0] ?? null

  const bcp47 = BCP47_LANGUAGE_MAP[language] || language
  const normalizedLang = language.toLowerCase().split('-')[0]
  const isEnglish = normalizedLang === 'en'

  // For English: Prioritize clear, natural MALE voices
  if (isEnglish) {
    // 2a. Male voice with exact BCP-47 match (e.g. en-US Male)
    const exactMale = voices.find((v) => {
      const vLang = v.lang.replace('_', '-').toLowerCase()
      return vLang === bcp47.toLowerCase() && isMaleVoice(v)
    })
    if (exactMale) return exactMale

    // 2b. Male voice with en-US dialect
    const enUsMale = voices.find((v) => {
      const vLang = v.lang.replace('_', '-').toLowerCase()
      return (vLang === 'en-us' || vLang.startsWith('en-us-')) && isMaleVoice(v)
    })
    if (enUsMale) return enUsMale

    // 2c. Any English male voice (e.g. en-GB, en-AU, en-IN)
    const anyEnMale = voices.find((v) => {
      const vLang = v.lang.replace('_', '-').toLowerCase()
      return (vLang.startsWith('en-') || vLang === 'en') && isMaleVoice(v)
    })
    if (anyEnMale) return anyEnMale
  }

  // 3. Exact BCP-47 match (e.g. "es-ES", "fr-FR", "de-DE", "hi-IN", "en-US")
  const exactMatch = voices.find(
    (v) => v.lang.replace('_', '-').toLowerCase() === bcp47.toLowerCase()
  )
  if (exactMatch) return exactMatch

  // 4. Language prefix match (e.g. starts with "es", "fr", "de", "hi", "en")
  const prefixMatch = voices.find((v) => {
    const vLang = v.lang.replace('_', '-').toLowerCase()
    return vLang.startsWith(`${normalizedLang}-`) || vLang === normalizedLang
  })
  if (prefixMatch) return prefixMatch

  // 5. Default or first available voice
  const defaultVoice = voices.find((v) => v.default)
  return defaultVoice || voices[0] || null
}


export interface UseSpeechSynthesisOptions {
  language?: string
  preferredVoiceName?: string | null
  rate?: number
  pitch?: number
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: string) => void
}

export interface UseSpeechSynthesisResult {
  status: SpeechSynthesisStatus
  isSupported: boolean
  isSpeaking: boolean
  error: string | null
  voices: SpeechSynthesisVoice[]
  speak: (text: string, overrideOptions?: { language?: string; voiceName?: string; rate?: number }) => void
  stop: () => void
  cancel: () => void
  clearError: () => void
}

export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}): UseSpeechSynthesisResult {
  const {
    language = 'en',
    preferredVoiceName = null,
    rate = 0.95,
    pitch = 1.0,
    onStart,
    onEnd,
    onError,
  } = options

  const [status, setStatus] = useState<SpeechSynthesisStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  const isSupported = isSpeechSynthesisSupported()
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const onStartRef = useRef(onStart)
  const onEndRef = useRef(onEnd)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onStartRef.current = onStart
    onEndRef.current = onEnd
    onErrorRef.current = onError
  }, [onStart, onEnd, onError])

  // Load and subscribe to voice changes
  useEffect(() => {
    if (!isSupported) return

    const updateVoices = () => {
      try {
        const available = window.speechSynthesis.getVoices()
        if (available && available.length > 0) {
          setVoices(available)
        }
      } catch {
        // Ignore voice loading error
      }
    }

    updateVoices()

    if (typeof window.speechSynthesis.addEventListener === 'function') {
      window.speechSynthesis.addEventListener('voiceschanged', updateVoices)
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', updateVoices)
      }
    } else {
      window.speechSynthesis.onvoiceschanged = updateVoices
      return () => {
        if (window.speechSynthesis.onvoiceschanged === updateVoices) {
          window.speechSynthesis.onvoiceschanged = null
        }
      }
    }
  }, [isSupported])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const cancel = useCallback(() => {
    if (!isSupported) return
    try {
      window.speechSynthesis.cancel()
    } catch {
      // Ignore cancellation errors
    }
    currentUtteranceRef.current = null
    setStatus('stopped')
  }, [isSupported])

  const stop = useCallback(() => {
    cancel()
  }, [cancel])

  const speak = useCallback(
    (text: string, overrideOptions: { language?: string; voiceName?: string; rate?: number } = {}) => {
      const cleanText = text.trim()
      if (!cleanText) return

      setError(null)

      if (!isSupported) {
        setError('Text-to-speech is not supported in this browser.')
        setStatus('error')
        onErrorRef.current?.('Text-to-speech is not supported in this browser.')
        return
      }

      try {
        // Cancel any pending/previous speech
        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(cleanText)
        currentUtteranceRef.current = utterance

        const activeLang = overrideOptions.language || language
        const targetVoice = selectMatchingVoice(
          voices,
          activeLang,
          overrideOptions.voiceName || preferredVoiceName
        )

        if (targetVoice) {
          utterance.voice = targetVoice
          utterance.lang = targetVoice.lang
        } else {
          utterance.lang = BCP47_LANGUAGE_MAP[activeLang] || activeLang
        }

        utterance.rate = overrideOptions.rate ?? rate
        utterance.pitch = pitch

        utterance.onstart = () => {
          setStatus('speaking')
          setError(null)
          onStartRef.current?.()
        }

        utterance.onend = () => {
          setStatus('idle')
          currentUtteranceRef.current = null
          onEndRef.current?.()
        }

        utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
          // 'canceled' or 'interrupted' are expected when user stops/replays
          if (event.error === 'canceled' || event.error === 'interrupted') {
            setStatus('stopped')
            currentUtteranceRef.current = null
            return
          }

          const errorMsg = 'Could not play audio for the tutor response.'
          setError(errorMsg)
          setStatus('error')
          currentUtteranceRef.current = null
          onErrorRef.current?.(errorMsg)
        }

        setStatus('loading')
        window.speechSynthesis.speak(utterance)
      } catch {
        const errorMsg = 'Could not start text-to-speech playback.'
        setError(errorMsg)
        setStatus('error')
        onErrorRef.current?.(errorMsg)
      }
    },
    [isSupported, language, pitch, preferredVoiceName, rate, voices]
  )

  // Clean up speech on component unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        try {
          window.speechSynthesis.cancel()
        } catch {
          // Ignore unmount cleanup errors
        }
      }
    }
  }, [isSupported])

  return {
    status,
    isSupported,
    isSpeaking: status === 'speaking',
    error,
    voices,
    speak,
    stop,
    cancel,
    clearError,
  }
}
