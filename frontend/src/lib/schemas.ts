import { z } from 'zod'

export const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'hi', label: 'Hindi' },
] as const

export const proficiencies = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
] as const

export const profileSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string().nullable(),
  target_language: z.enum(['en', 'es', 'fr', 'de', 'hi']),
  proficiency: z.enum(['beginner', 'intermediate', 'advanced']),
  preferred_voice: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const profileUpdateSchema = z.object({
  display_name: z.string().trim().max(80).nullable().optional(),
  target_language: z.enum(['en', 'es', 'fr', 'de', 'hi']).optional(),
  proficiency: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  preferred_voice: z.string().trim().max(255).nullable().optional(),
})

export const grammarIssueSchema = z.object({
  type: z.string(),
  original: z.string(),
  correction: z.string(),
  explanation: z.string(),
})

export const vocabularySuggestionSchema = z.object({
  original: z.string(),
  suggestion: z.string(),
  why: z.string(),
})

export const tutorFeedbackSchema = z.object({
  corrected_sentence: z.string(),
  grammar_issues: z.array(grammarIssueSchema),
  explanation: z.string(),
  vocabulary_suggestions: z.array(vocabularySuggestionSchema),
  natural_alternative: z.string(),
  encouragement: z.string(),
  follow_up_question: z.string(),
  mistake_categories: z.array(z.string()),
})

export const practiceSessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  language: z.enum(['en', 'es', 'fr', 'de', 'hi']),
  proficiency: z.enum(['beginner', 'intermediate', 'advanced']),
  started_at: z.string(),
  ended_at: z.string().nullable(),
  turn_count: z.number().int().nonnegative(),
  summary: z.string().nullable(),
})

export const practiceMessageSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  role: z.enum(['user', 'tutor']),
  content: z.string(),
  structured_feedback: tutorFeedbackSchema.nullable(),
  created_at: z.string(),
})

export const sessionDetailSchema = z.object({
  session: practiceSessionSchema,
  messages: z.array(practiceMessageSchema),
})

export const grammarCategoryCountSchema = z.object({
  category: z.string(),
  count: z.number().int().nonnegative(),
})

export const recentSessionItemSchema = z.object({
  id: z.string().uuid(),
  language: z.enum(['en', 'es', 'fr', 'de', 'hi']),
  proficiency: z.enum(['beginner', 'intermediate', 'advanced']),
  started_at: z.string(),
  ended_at: z.string().nullable(),
  turn_count: z.number().int().nonnegative(),
  duration_seconds: z.number().int().nonnegative().nullable(),
})

export const progressSummarySchema = z.object({
  total_sessions: z.number().int().nonnegative(),
  total_sentences: z.number().int().nonnegative(),
  total_corrections: z.number().int().nonnegative(),
  current_level: z.enum(['beginner', 'intermediate', 'advanced']),
  target_language: z.enum(['en', 'es', 'fr', 'de', 'hi']),
  streak_days: z.number().int().nonnegative(),
  common_mistakes: z.array(grammarCategoryCountSchema),
  recent_sessions: z.array(recentSessionItemSchema),
})

export type Profile = z.infer<typeof profileSchema>
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>
export type TutorFeedback = z.infer<typeof tutorFeedbackSchema>
export type PracticeSession = z.infer<typeof practiceSessionSchema>
export type PracticeMessage = z.infer<typeof practiceMessageSchema>
export type SessionDetail = z.infer<typeof sessionDetailSchema>
export type GrammarCategoryCount = z.infer<typeof grammarCategoryCountSchema>
export type RecentSessionItem = z.infer<typeof recentSessionItemSchema>
export type ProgressSummary = z.infer<typeof progressSummarySchema>

