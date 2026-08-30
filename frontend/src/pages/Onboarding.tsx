import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { OptimusLogo } from '../components/brand/OptimusLogo'
import { languages, proficiencies, type ProfileUpdate } from '../lib/schemas'
import { useAuthStore } from '../stores/authStore'
import { useProfileStore } from '../stores/profileStore'

export function Onboarding() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const save = useProfileStore((state) => state.save)
  const [displayName, setDisplayName] = useState('')
  const [targetLanguage, setTargetLanguage] = useState<ProfileUpdate['target_language']>()
  const [proficiency, setProficiency] = useState<ProfileUpdate['proficiency']>()
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user || !targetLanguage || !proficiency) return
    setError(null)
    setIsSaving(true)
    try {
      await save(
        {
          display_name: displayName.trim() || null,
          target_language: targetLanguage,
          proficiency,
        },
        user.id
      )
      navigate('/app', { replace: true })
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save your profile. Please try again.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/3 left-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute top-1/2 right-1/4 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      <section className="cyber-card-glow relative w-full max-w-2xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-indigo-500/35">
        <div className="absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-cyan-400/75 to-transparent" />

        <div className="flex items-center gap-3.5">
          <OptimusLogo size={46} glow={true} />
          <div>
            <p className="text-[11px] font-bold tracking-[0.2em] text-cyan-400 uppercase">
              NEURAL CALIBRATION · PROTOCOL INIT
            </p>
            <h1 className="font-cyber text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Calibrate OPTIMUS.
            </h1>
          </div>
        </div>

        <p className="mt-4 leading-7 text-slate-300">
          Choose your target language and proficiency level. OPTIMUS will calibrate vocabulary difficulty, speech recognition parameters, and grammar feedback to your profile.
        </p>

        <form className="mt-8 grid gap-7" onSubmit={submit}>
          <label className="grid max-w-md gap-2 text-xs font-semibold tracking-wider text-slate-300 uppercase" htmlFor="display-name">
            Display Name <span className="font-normal text-slate-500 lowercase">(optional)</span>
            <input
              id="display-name"
              className="rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-3 text-base text-white outline-none transition-all placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-900/90 focus:shadow-[0_0_15px_rgba(0,212,255,0.25)]"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="e.g. Alex"
              maxLength={80}
              autoComplete="name"
            />
          </label>

          <fieldset>
            <legend className="text-xs font-bold tracking-wider text-slate-300 uppercase">
              Target Language
            </legend>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {languages.map((language) => (
                <OptionButton
                  key={language.value}
                  active={targetLanguage === language.value}
                  onClick={() => setTargetLanguage(language.value)}
                >
                  {language.label}
                </OptionButton>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-bold tracking-wider text-slate-300 uppercase">
              Current Proficiency Level
            </legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {proficiencies.map((level) => (
                <OptionButton
                  key={level.value}
                  active={proficiency === level.value}
                  onClick={() => setProficiency(level.value)}
                >
                  {level.label}
                </OptionButton>
              ))}
            </div>
          </fieldset>

          {error && (
            <p className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-xs text-rose-300" role="alert">
              {error}
            </p>
          )}

          <button
            className="cyber-btn-primary w-full max-w-md rounded-xl px-6 py-4 text-sm font-extrabold tracking-wider uppercase transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            disabled={!targetLanguage || !proficiency || isSaving}
          >
            {isSaving ? 'Calibrating Neural Profile…' : 'Enter OPTIMUS →'}
          </button>
        </form>
      </section>
    </main>
  )
}

function OptionButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: string
  onClick: () => void
}) {
  return (
    <button
      className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all ${
        active
          ? 'border-cyan-400 bg-cyan-950/50 text-cyan-200 shadow-[0_0_18px_rgba(0,212,255,0.25)] ring-1 ring-cyan-400/50'
          : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900/70 hover:text-white'
      }`}
      type="button"
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

