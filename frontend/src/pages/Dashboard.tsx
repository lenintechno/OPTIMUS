import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { OptimusLogo } from '../components/brand/OptimusLogo'
import { apiRequest } from '../lib/api'
import {
  languages,
  proficiencies,
  progressSummarySchema,
  type ProgressSummary,
} from '../lib/schemas'
import { useAuthStore } from '../stores/authStore'
import { useProfileStore } from '../stores/profileStore'

export function Dashboard() {
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const profile = useProfileStore((state) => state.profile)

  const [progress, setProgress] = useState<ProgressSummary | null>(null)
  const [isLoadingProgress, setIsLoadingProgress] = useState(true)

  async function logout() {
    await signOut()
    navigate('/login')
  }

  useEffect(() => {
    let isMounted = true
    async function loadProgress() {
      try {
        setIsLoadingProgress(true)
        const rawData = await apiRequest<unknown>('/api/v1/sessions/progress')
        const parsed = progressSummarySchema.parse(rawData)
        if (isMounted) {
          setProgress(parsed)
        }
      } catch {
        // Gracefully handle or keep null
      } finally {
        if (isMounted) {
          setIsLoadingProgress(false)
        }
      }
    }

    void loadProgress()
    return () => {
      isMounted = false
    }
  }, [])

  const language = languages.find((item) => item.value === profile?.target_language)?.label
  const proficiency = proficiencies.find((item) => item.value === profile?.proficiency)?.label

  return (
    <main className="min-h-[100dvh] bg-[var(--surface)] px-4 py-6 text-[var(--text-primary)] sm:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-6xl flex-col">
        {/* Header with OPTIMUS Logo */}
        <header className="flex items-center justify-between border-b border-slate-800/80 pb-4 pt-2">
          <div className="flex items-center gap-3">
            <OptimusLogo size={36} glow={true} showWordmark={true} />
          </div>
          <button
            className="rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-2 text-xs font-bold tracking-wider text-slate-300 uppercase transition-all hover:border-rose-500/60 hover:bg-rose-950/30 hover:text-rose-300 shadow-sm cursor-pointer"
            type="button"
            onClick={logout}
          >
            Log out
          </button>
        </header>

        {/* Dashboard Hero Section */}
        <section className="py-8">
          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-stretch">
            {/* Main Welcome Card */}
            <div className="cyber-card-glow relative rounded-3xl p-7 sm:p-9 shadow-2xl border border-indigo-500/35 flex flex-col justify-between">
              <div className="absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-cyan-400/75 to-transparent" />

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-950/40 px-3.5 py-1 text-xs font-bold tracking-wider text-cyan-300 uppercase shadow-[0_0_12px_rgba(0,212,255,0.2)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    {language ?? 'English'}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-indigo-500/40 bg-indigo-950/40 px-3.5 py-1 text-xs font-bold tracking-wider text-indigo-300 uppercase">
                    {proficiency ?? 'Beginner'} Level
                  </span>
                  {progress && progress.streak_days > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-950/30 px-3 py-1 text-xs font-bold tracking-wider text-amber-300 uppercase">
                      🔥 {progress.streak_days} Day Streak
                    </span>
                  )}
                </div>

                <h1 className="font-cyber mt-5 text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
                  Welcome back{profile?.display_name ? `, ${profile.display_name}` : ''}.
                </h1>

                <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-300">
                  Practice {language} at your {proficiency?.toLowerCase()} level with real-time speech transcription, structured grammar corrections, natural phrasing alternatives, and voice audio guidance from OPTIMUS.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                  className="cyber-btn-primary rounded-xl px-7 py-3.5 text-sm font-extrabold tracking-wider uppercase transition-transform active:scale-[0.98] cursor-pointer"
                  type="button"
                  onClick={() => navigate('/practice')}
                >
                  Start Voice & Text Practice →
                </button>
                <span className="text-xs text-slate-400 font-mono">
                  Operator: <span className="text-slate-300">{user?.email ?? 'active'}</span>
                </span>
              </div>
            </div>

            {/* Neural System Features Grid */}
            <div className="grid gap-3.5 sm:grid-cols-3 lg:grid-cols-1">
              <div className="cyber-card rounded-2xl p-4 border border-cyan-500/20 shadow-md flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-950/40 text-cyan-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-cyber text-xs font-bold text-white tracking-wide">Neural Speech Recognition</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Continuous microphone transcription.</p>
                </div>
              </div>

              <div className="cyber-card rounded-2xl p-4 border border-indigo-500/20 shadow-md flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/40 bg-indigo-950/40 text-indigo-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-cyber text-xs font-bold text-white tracking-wide">Tutor Voice Synthesis</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Spoken guidance & male voice priority.</p>
                </div>
              </div>

              <div className="cyber-card rounded-2xl p-4 border border-rose-500/20 shadow-md flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-500/40 bg-rose-950/40 text-rose-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-cyber text-xs font-bold text-white tracking-wide">Structured Feedback</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Grammar notes & natural alternatives.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Learning Progress Section */}
        <section className="py-4">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <h2 className="font-cyber text-lg sm:text-xl font-bold tracking-wider text-white uppercase">
                OPTIMUS Learning Progress
              </h2>
            </div>
            <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase">
              Neural Activity Feed
            </span>
          </div>

          {/* 4 Stat Metric Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="cyber-card relative rounded-2xl p-5 border border-cyan-500/30 shadow-lg">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Practice Sessions
              </span>
              <p className="font-cyber mt-2 text-2xl sm:text-3xl font-extrabold text-cyan-300">
                {isLoadingProgress ? '…' : (progress?.total_sessions ?? 0)}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Completed dialogues</p>
            </div>

            <div className="cyber-card relative rounded-2xl p-5 border border-indigo-500/30 shadow-lg">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Sentences Practiced
              </span>
              <p className="font-cyber mt-2 text-2xl sm:text-3xl font-extrabold text-indigo-300">
                {isLoadingProgress ? '…' : (progress?.total_sentences ?? 0)}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Learner turns analyzed</p>
            </div>

            <div className="cyber-card relative rounded-2xl p-5 border border-rose-500/30 shadow-lg">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Corrections Received
              </span>
              <p className="font-cyber mt-2 text-2xl sm:text-3xl font-extrabold text-rose-300">
                {isLoadingProgress ? '…' : (progress?.total_corrections ?? 0)}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Refined speech patterns</p>
            </div>

            <div className="cyber-card relative rounded-2xl p-5 border border-purple-500/30 shadow-lg">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Current Level
              </span>
              <p className="font-cyber mt-2 text-xl sm:text-2xl font-extrabold text-purple-300 capitalize">
                {proficiency ?? 'Beginner'}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                {progress && progress.streak_days > 0 ? `${progress.streak_days} day streak active` : 'Daily consistency active'}
              </p>
            </div>
          </div>

          {/* Grammar Insights & Practice History Grid */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.35fr]">
            {/* Grammar Insights Card */}
            <div className="cyber-card-glow rounded-3xl p-6 shadow-xl border border-indigo-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <h3 className="font-cyber text-sm font-bold tracking-wider text-white uppercase">
                    Grammar Insights
                  </h3>
                  <span className="text-[10.5px] font-mono text-indigo-400 uppercase">
                    Category Breakdown
                  </span>
                </div>

                {progress && progress.common_mistakes.length > 0 ? (
                  <div className="mt-4 grid gap-3">
                    {progress.common_mistakes.map((item) => {
                      const maxCount = Math.max(...progress.common_mistakes.map((m) => m.count), 1)
                      const percentage = Math.round((item.count / maxCount) * 100)
                      return (
                        <div key={item.category} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-200">{item.category}</span>
                            <span className="font-mono text-xs font-bold text-cyan-300">
                              {item.count} {item.count === 1 ? 'correction' : 'corrections'}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900/80 border border-slate-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-400">
                    <p className="font-cyber font-semibold text-slate-300">No Recurring Mistakes Yet</p>
                    <p className="mt-1 text-slate-500">
                      OPTIMUS will automatically identify and categorize recurring grammar patterns as you complete more practice turns.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-slate-800/80 pt-3 text-[11px] text-slate-500">
                Data synthesized from your actual tutor corrections.
              </div>
            </div>

            {/* Practice History Card */}
            <div className="cyber-card-glow rounded-3xl p-6 shadow-xl border border-indigo-500/30">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="font-cyber text-sm font-bold tracking-wider text-white uppercase">
                  Recent Practice History
                </h3>
                <span className="text-[10.5px] font-mono text-cyan-400 uppercase">
                  Latest Activity
                </span>
              </div>

              {progress && progress.recent_sessions.length > 0 ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-[10.5px] font-bold text-slate-400 uppercase">
                        <th className="pb-2.5">Date</th>
                        <th className="pb-2.5">Language</th>
                        <th className="pb-2.5">Sentences</th>
                        <th className="pb-2.5">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {progress.recent_sessions.map((sess) => (
                        <tr key={sess.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="py-3 font-medium text-slate-200">
                            {formatSessionDate(sess.started_at)}
                          </td>
                          <td className="py-3">
                            <span className="inline-flex items-center rounded-md border border-cyan-500/30 bg-cyan-950/30 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 uppercase">
                              {sess.language} · {sess.proficiency}
                            </span>
                          </td>
                          <td className="py-3 font-mono font-bold text-slate-300">
                            {sess.turn_count} {sess.turn_count === 1 ? 'turn' : 'turns'}
                          </td>
                          <td className="py-3 text-slate-400 font-mono">
                            {formatDuration(sess.duration_seconds)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-400">
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-950/40 text-cyan-400">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                  </div>
                  <p className="font-cyber font-bold text-slate-200 tracking-wide">
                    Your OPTIMUS journey starts here.
                  </p>
                  <p className="mt-1 text-slate-500">
                    Start your first practice session to begin tracking speech fluency, grammar nuances, and progress over time.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Creator Credit Footer */}
        <footer className="mt-auto border-t border-slate-800/80 pt-6 pb-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
            <span className="font-cyber text-[11px] tracking-wider text-slate-400 uppercase">
              OPTIMUS NEURAL PLATFORM
            </span>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-1.5 text-xs text-slate-400 shadow-sm">
            <span className="text-slate-400">Designed &amp; Developed by</span>
            <span className="font-semibold text-cyan-300 drop-shadow-[0_0_8px_rgba(0,212,255,0.4)]">
              Lenin R
            </span>
          </div>
        </footer>
      </div>
    </main>
  )
}

function formatSessionDate(dateString: string): string {
  try {
    const d = new Date(dateString)
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return 'In progress'
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSecs = seconds % 60
  return remainingSecs > 0 ? `${minutes}m ${remainingSecs}s` : `${minutes}m`
}


