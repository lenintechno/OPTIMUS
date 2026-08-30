import type { PracticeMessage } from '../../lib/schemas'

export function ConversationHistory({ messages }: { messages: PracticeMessage[] }) {
  if (messages.length === 0) {
    return (
      <div className="cyber-card rounded-2xl border border-dashed border-slate-700/80 p-8 text-center text-sm leading-6 text-slate-400 shadow-inner">
        <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-950/40 text-cyan-400">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
        </div>
        <p className="font-cyber font-bold text-slate-200 tracking-wide">Dialogue Stream Standby</p>
        <p className="mt-1 text-xs text-slate-400">
          Your practice sentences and OPTIMUS responses will stream here in real time.
        </p>
      </div>
    )
  }

  return (
    <ol className="grid gap-3.5" aria-label="Conversation history">
      {messages.map((message) => {
        const isUser = message.role === 'user'
        return (
          <li
            className={`max-w-[94%] rounded-2xl p-4 text-sm leading-6 shadow-md transition-all ${
              isUser
                ? 'justify-self-end border border-cyan-500/40 bg-gradient-to-r from-sky-950/90 to-indigo-950/95 text-slate-100 shadow-[0_0_16px_rgba(0,212,255,0.18)]'
                : 'cyber-card border border-indigo-500/35 text-slate-100 shadow-[0_0_16px_rgba(139,92,246,0.15)]'
            }`}
            key={message.id}
          >
            <div className="mb-1.5 flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isUser ? 'bg-cyan-400' : 'bg-indigo-400'
                }`}
              />
              <p
                className={`text-[10.5px] font-extrabold tracking-widest uppercase ${
                  isUser ? 'text-cyan-300' : 'text-indigo-300'
                }`}
              >
                {isUser ? 'YOU (LEARNER)' : 'OPTIMUS (AI TUTOR)'}
              </p>
            </div>
            <p className="text-sm leading-relaxed text-slate-200">{message.content}</p>
          </li>
        )
      })}
    </ol>
  )
}

