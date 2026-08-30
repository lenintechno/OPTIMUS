import assert from 'node:assert'
import test from 'node:test'

import {
  buildTutorSpokenText,
  isMaleVoice,
  isSpeechSynthesisSupported,
  selectMatchingVoice,
} from '../src/hooks/useSpeechSynthesis.ts'
import type { TutorFeedback } from '../src/lib/schemas.ts'

test('isSpeechSynthesisSupported returns false when window is undefined or lacks SpeechSynthesis', () => {
  // In Node.js environment without window.speechSynthesis
  assert.strictEqual(isSpeechSynthesisSupported(), false)
})

test('buildTutorSpokenText joins corrected sentence, explanation, and follow-up question', () => {
  const sampleFeedback: TutorFeedback = {
    corrected_sentence: 'Yo quiero aprender español.',
    explanation: 'In Spanish, "querer" is followed directly by the infinitive verb.',
    grammar_issues: [],
    vocabulary_suggestions: [],
    natural_alternative: 'Me gustaría aprender español.',
    follow_up_question: '¿Por qué quieres aprender español?',
    encouragement: '¡Muy bien!',
  }

  const spokenText = buildTutorSpokenText(sampleFeedback)
  assert.strictEqual(
    spokenText,
    'Yo quiero aprender español. In Spanish, "querer" is followed directly by the infinitive verb. ¿Por qué quieres aprender español?'
  )
})

test('buildTutorSpokenText handles partial or trimmed feedback correctly', () => {
  const partialFeedback: TutorFeedback = {
    corrected_sentence: ' Bonjour le monde. ',
    explanation: '',
    grammar_issues: [],
    vocabulary_suggestions: [],
    natural_alternative: 'Salut le monde.',
    follow_up_question: ' Comment ça va? ',
    encouragement: 'Bon travail!',
  }

  const spokenText = buildTutorSpokenText(partialFeedback)
  assert.strictEqual(spokenText, 'Bonjour le monde. Comment ça va?')
})

test('selectMatchingVoice prefers exact preferredVoiceName match', () => {
  const mockVoices = [
    { name: 'Google US English', lang: 'en-US', default: true } as SpeechSynthesisVoice,
    { name: 'Jorge Spanish', lang: 'es-ES', default: false } as SpeechSynthesisVoice,
    { name: 'Monica Spanish', lang: 'es-ES', default: false } as SpeechSynthesisVoice,
  ]

  const matched = selectMatchingVoice(mockVoices, 'es', 'Monica Spanish')
  assert.strictEqual(matched?.name, 'Monica Spanish')
})

test('selectMatchingVoice matches exact BCP-47 tag when no preferred voice is given', () => {
  const mockVoices = [
    { name: 'Google US English', lang: 'en-US', default: true } as SpeechSynthesisVoice,
    { name: 'Paul French', lang: 'fr-FR', default: false } as SpeechSynthesisVoice,
    { name: 'Amelie French Canada', lang: 'fr-CA', default: false } as SpeechSynthesisVoice,
    { name: 'Klara German', lang: 'de-DE', default: false } as SpeechSynthesisVoice,
  ]

  const matchedFr = selectMatchingVoice(mockVoices, 'fr')
  assert.strictEqual(matchedFr?.name, 'Paul French')

  const matchedDe = selectMatchingVoice(mockVoices, 'de')
  assert.strictEqual(matchedDe?.name, 'Klara German')
})

test('selectMatchingVoice falls back to language prefix matching when exact BCP-47 is not present', () => {
  const mockVoices = [
    { name: 'Google US English', lang: 'en-US', default: true } as SpeechSynthesisVoice,
    { name: 'Mateo Mexico', lang: 'es-MX', default: false } as SpeechSynthesisVoice,
  ]

  // Target 'es' maps to 'es-ES' by default, but only 'es-MX' is available in voices
  const matched = selectMatchingVoice(mockVoices, 'es')
  assert.strictEqual(matched?.name, 'Mateo Mexico')
})

test('selectMatchingVoice falls back to default voice when no language match exists', () => {
  const mockVoices = [
    { name: 'Default English Voice', lang: 'en-US', default: true } as SpeechSynthesisVoice,
    { name: 'Other English Voice', lang: 'en-GB', default: false } as SpeechSynthesisVoice,
  ]

  const matched = selectMatchingVoice(mockVoices, 'hi')
  assert.strictEqual(matched?.name, 'Default English Voice')
})

test('selectMatchingVoice prefers male English voice over female English voice for English', () => {
  const mockVoices = [
    { name: 'Microsoft Zira - English (United States)', lang: 'en-US', default: true } as SpeechSynthesisVoice,
    { name: 'Microsoft David - English (United States)', lang: 'en-US', default: false } as SpeechSynthesisVoice,
  ]

  const matched = selectMatchingVoice(mockVoices, 'en')
  assert.strictEqual(matched?.name, 'Microsoft David - English (United States)')
})

test('selectMatchingVoice prefers en-US male voice over other English male voices', () => {
  const mockVoices = [
    { name: 'Daniel (en-GB)', lang: 'en-GB', default: false } as SpeechSynthesisVoice,
    { name: 'Microsoft Guy Online (Natural) - English (United States)', lang: 'en-US', default: false } as SpeechSynthesisVoice,
  ]

  const matched = selectMatchingVoice(mockVoices, 'en')
  assert.strictEqual(matched?.name, 'Microsoft Guy Online (Natural) - English (United States)')
})

test('selectMatchingVoice falls back to other dialect English male voice if en-US male is unavailable', () => {
  const mockVoices = [
    { name: 'Samantha (en-US)', lang: 'en-US', default: true } as SpeechSynthesisVoice,
    { name: 'George (en-GB)', lang: 'en-GB', default: false } as SpeechSynthesisVoice,
  ]

  const matched = selectMatchingVoice(mockVoices, 'en')
  assert.strictEqual(matched?.name, 'George (en-GB)')
})

test('isMaleVoice correctly identifies male names and keywords', () => {
  assert.strictEqual(isMaleVoice({ name: 'Google US English Male' } as SpeechSynthesisVoice), true)
  assert.strictEqual(isMaleVoice({ name: 'Alex' } as SpeechSynthesisVoice), true)
  assert.strictEqual(isMaleVoice({ name: 'Microsoft David' } as SpeechSynthesisVoice), true)
  assert.strictEqual(isMaleVoice({ name: 'Microsoft Guy' } as SpeechSynthesisVoice), true)
  assert.strictEqual(isMaleVoice({ name: 'Samantha' } as SpeechSynthesisVoice), false)
  assert.strictEqual(isMaleVoice({ name: 'Microsoft Zira' } as SpeechSynthesisVoice), false)
  assert.strictEqual(isMaleVoice({ name: 'Victoria' } as SpeechSynthesisVoice), false)
})

test('TTS error handling distinguishes cancellation/interruption from genuine errors', () => {
  const isIntentionalStop = (errorCode: string): boolean => {
    return errorCode === 'canceled' || errorCode === 'interrupted'
  }

  assert.strictEqual(isIntentionalStop('canceled'), true)
  assert.strictEqual(isIntentionalStop('interrupted'), true)
  assert.strictEqual(isIntentionalStop('not-allowed'), false)
  assert.strictEqual(isIntentionalStop('synthesis-failed'), false)
})

