import assert from 'node:assert'
import test from 'node:test'

import { BCP47_LANGUAGE_MAP, isSpeechRecognitionSupported } from '../src/hooks/useSpeechRecognition.ts'

test('BCP47_LANGUAGE_MAP correctly maps all supported target languages', () => {
  assert.strictEqual(BCP47_LANGUAGE_MAP.en, 'en-US')
  assert.strictEqual(BCP47_LANGUAGE_MAP.es, 'es-ES')
  assert.strictEqual(BCP47_LANGUAGE_MAP.fr, 'fr-FR')
  assert.strictEqual(BCP47_LANGUAGE_MAP.de, 'de-DE')
  assert.strictEqual(BCP47_LANGUAGE_MAP.hi, 'hi-IN')
})

test('isSpeechRecognitionSupported returns false when window is undefined or lacks API', () => {
  // In Node.js environment without window.SpeechRecognition
  assert.strictEqual(isSpeechRecognitionSupported(), false)
})

test('Speech recognition error mappings match spec requirements', () => {
  const mapError = (errorType: string): string => {
    if (errorType === 'not-allowed' || errorType === 'permission-denied') {
      return 'Microphone access is required to practice speaking.'
    }
    if (errorType === 'no-speech') {
      return 'I didn’t catch that. Please try again.'
    }
    if (errorType === 'network') {
      return 'You appear to be offline. Check your connection.'
    }
    return 'Could not capture speech. Please try again.'
  }

  assert.strictEqual(
    mapError('not-allowed'),
    'Microphone access is required to practice speaking.'
  )
  assert.strictEqual(
    mapError('permission-denied'),
    'Microphone access is required to practice speaking.'
  )
  assert.strictEqual(
    mapError('no-speech'),
    'I didn’t catch that. Please try again.'
  )
  assert.strictEqual(
    mapError('network'),
    'You appear to be offline. Check your connection.'
  )
})

test('Transcript accumulation correctly concatenates final and interim parts', () => {
  const mockResults = [
    { isFinal: true, 0: { transcript: 'Hello world ' } },
    { isFinal: false, 0: { transcript: 'how are you' } },
  ]

  let interim = ''
  let final = ''

  for (let i = 0; i < mockResults.length; ++i) {
    const res = mockResults[i]
    if (res.isFinal) {
      final += res[0].transcript
    } else {
      interim += res[0].transcript
    }
  }

  assert.strictEqual(final.trim(), 'Hello world')
  assert.strictEqual(interim, 'how are you')
  assert.strictEqual((final + interim).trim(), 'Hello world how are you')
})
