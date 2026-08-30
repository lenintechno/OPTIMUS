import assert from 'node:assert'
import test from 'node:test'

import {
  progressSummarySchema,
  type ProgressSummary,
} from '../src/lib/schemas.ts'

test('progressSummarySchema parses valid progress data correctly', () => {
  const sampleProgress: ProgressSummary = {
    total_sessions: 5,
    total_sentences: 24,
    total_corrections: 8,
    current_level: 'intermediate',
    target_language: 'en',
    streak_days: 3,
    common_mistakes: [
      { category: 'Subject-Verb Agreement', count: 4 },
      { category: 'Articles', count: 3 },
      { category: 'Verb Tense', count: 1 },
    ],
    recent_sessions: [
      {
        id: '22222222-2222-4222-8222-222222222222',
        language: 'en',
        proficiency: 'intermediate',
        started_at: '2026-08-30T09:00:00Z',
        ended_at: '2026-08-30T09:08:30Z',
        turn_count: 6,
        duration_seconds: 510,
      },
    ],
  }

  const parsed = progressSummarySchema.parse(sampleProgress)
  assert.strictEqual(parsed.total_sessions, 5)
  assert.strictEqual(parsed.total_sentences, 24)
  assert.strictEqual(parsed.total_corrections, 8)
  assert.strictEqual(parsed.streak_days, 3)
  assert.strictEqual(parsed.common_mistakes.length, 3)
  assert.strictEqual(parsed.recent_sessions.length, 1)
  assert.strictEqual(parsed.recent_sessions[0].turn_count, 6)
})

test('progressSummarySchema handles empty progress for new users cleanly', () => {
  const emptyProgress = {
    total_sessions: 0,
    total_sentences: 0,
    total_corrections: 0,
    current_level: 'beginner',
    target_language: 'en',
    streak_days: 0,
    common_mistakes: [],
    recent_sessions: [],
  }

  const parsed = progressSummarySchema.parse(emptyProgress)
  assert.strictEqual(parsed.total_sessions, 0)
  assert.strictEqual(parsed.total_sentences, 0)
  assert.strictEqual(parsed.total_corrections, 0)
  assert.strictEqual(parsed.streak_days, 0)
  assert.deepStrictEqual(parsed.common_mistakes, [])
  assert.deepStrictEqual(parsed.recent_sessions, [])
})
