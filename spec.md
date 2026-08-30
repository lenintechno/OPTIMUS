# OPTIMUS — AI Voice Language Tutor
## Engineering Specification
Version: 1.0
Date: 2026-08-28
Target: Generative AI Internship — Project 4 (AI Voice Language Tutor)
Audience: AI coding agent (Codex) + human reviewer

---

## 1. Project Summary

**OPTIMUS** is a completely new, greenfield voice-first AI language tutor application.

A learner selects a target language and proficiency level, speaks a sentence into the microphone, and receives intelligent, structured feedback from an LLM. The system transcribes speech, analyzes grammar and vocabulary, returns a corrected sentence with explanations and suggestions, speaks the response via text-to-speech, and continues a natural conversational practice session. Recurring mistakes are tracked so the tutor can adapt future practice.

**Core experience loop (must work end-to-end before any stretch work):**
User selects language + proficiency
↓
User speaks into microphone
↓
Speech-to-Text
↓
LLM language analysis (structured output)
↓
Structured tutor feedback
(corrected sentence + explanation + vocabulary + natural phrasing + encouragement + follow-up)
↓
Text display + Text-to-Speech
↓
User hears response
↓
Conversation continues
textThe product must feel like talking to a real language tutor, not filling out a grammar form.

**Time constraint:** Approximately 5 hours on Saturday evening + a full Sunday. Submission is Monday. Prioritize a reliable, demonstrable MVP. Stretch features are attempted only after the complete voice loop is stable and tested.

**Name:** OPTIMUS (AI Voice Language Tutor)

**Assumption:** This is a brand-new repository. No existing application code, no legacy database, no migration work, and no previous project architecture exist.

---

## 2. Source Material & Constraints

### Internship Required Core (from official Project 4 materials)
- Record the learner’s spoken sentence
- Transcribe with speech-to-text
- Use an LLM to assess grammar/vocabulary and generate feedback
- Read the corrected sentence back with text-to-speech
- Intermediate difficulty level indicated
- Stretch (optional): Track a learner’s progress across sessions and adapt difficulty over time

### Evaluation Criteria (exact from internship materials)
1. **End-to-End Functionality** — Does the full pipeline actually run (audio in → LLM output out)?
2. **Thoughtful LLM Use** — Prompting, error handling, and edge cases — not just an API call glued on.
3. **Speech-Handling Quality** — Transcription accuracy, latency, and handling of noisy or unclear audio.
4. **Code Quality & Structure** — Readable, modular code that someone else could pick up and extend.
5. **Documentation** — A clear README with setup steps, approach, assumptions, and known limitations.
6. **Creativity / Stretch Goals** — Bonus points for going beyond the core requirements.

### Reference Repository
https://github.com/thenitinsingh/LLMs-Meet-Speech

- A simple beginner-friendly Speech → STT → LLM → TTS demonstration using FastAPI and OpenAI.
- Use **only** to understand the basic separation of the three AI components.
- **Do NOT** copy its architecture, UI, code, prompts, folder structure, or features.
- OPTIMUS is a full product with authentication, persistence, adaptive learning, and a polished conversational UX.

### Ground Rules (from internship)
- Solo independent work
- Free to use public libraries, APIs, and documentation
- Note any AI coding assistant use briefly in the README
- Commit work incrementally with clear messages
- A clear README matters as much as the code
- Prefer a runnable end-to-end prototype over a polished but incomplete UI
- Deadline: Monday 11:59 PM (late submissions may not be reviewed)

---

## 3. Technology Decisions

| Layer              | Choice                                      | Rationale |
|--------------------|---------------------------------------------|-----------|
| Frontend           | React + Vite + TypeScript + Tailwind CSS   | Fast modern tooling, excellent developer experience, easy to produce a polished professional UI, high portfolio value. Tailwind enables rapid, consistent styling. |
| Backend            | Python + FastAPI                            | Lightweight, async-capable, excellent OpenAPI support, easy integration with LLM and speech services, aligns with common internship patterns. |
| LLM                | Google Gemini (via official google-generativeai SDK) | Generous free tier, strong structured JSON output support, good instruction following, low cost. Exact model name is configurable via environment variable (e.g. `gemini-1.5-flash`, `gemini-2.0-flash`, or current recommended model). |
| Database + Auth    | Supabase (PostgreSQL + Supabase Auth + RLS)| Free tier is sufficient for the project, built-in email/password authentication with JWT, Row Level Security for multi-user data isolation, zero custom auth boilerplate. |
| Speech-to-Text     | Browser Web Speech API (primary for MVP)   | Zero cost, low latency, works in Chrome/Edge, simple to implement, sufficient for a reliable demonstration. Optional backend fallback (Whisper or Gemini transcription) is stretch only. |
| Text-to-Speech     | Browser SpeechSynthesis API (primary for MVP) | Zero cost, immediate availability, good enough quality for the MVP demo. Optional higher-quality external TTS is stretch only. |
| Client State       | TanStack Query + light Zustand              | Clean server-state management and minimal local UI state. |
| Validation         | Pydantic (backend) + Zod (frontend)         | Strict schema validation for LLM JSON responses and API contracts. |
| Deployment         | Frontend: Vercel. Backend: Railway or Render free tier. DB: Supabase. | Free or low-cost, simple configuration, CORS-friendly. |

**Rejected for this weekend (to protect the deadline)**
- Local Whisper / Ollama (too heavy and machine-dependent for reliable demo)
- Complex vector databases or textbook RAG
- Native mobile applications
- Real-time streaming token-by-token audio
- Multi-agent systems or general personal-assistant tool calling
- Any features unrelated to language tutoring

**Environment variables (never commit secrets)**
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash          # or current recommended model — must be configurable
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=             # backend only
CORS_ORIGINS=http://localhost:5173,https://your-frontend.vercel.app [blocked]
textOptional fallback (stretch):
OPENAI_API_KEY=
text---

## 4. MVP vs Stretch vs Out of Scope

### MUST HAVE (P0) — Complete before any stretch work
- User registration, login, logout (Supabase Auth)
- Protected routes and user-scoped data isolation
- Target language + proficiency selection (starting set: English, Spanish, French, German, Hindi; levels: Beginner / Intermediate / Advanced)
- Start a practice session
- Microphone capture with clear UI states: Idle → Listening → Processing → Speaking → Error
- Browser speech-to-text → transcript display
- LLM structured analysis and feedback
- Text-to-speech playback of the corrected sentence and key feedback
- Conversational continuation within a session (history kept in context)
- Persist sessions, messages, and corrections
- Basic progress / history view (sessions completed, recent mistakes)
- Simple recurring-mistake detection via LLM category tags
- Polished, responsive UI (desktop + mobile usable)
- Comprehensive README
- Incremental Git history with meaningful messages
- Health check endpoint + graceful error handling throughout
- `.env.example` and clear local setup instructions

### STRETCH (P1 — only after all P0 items are green)
- Adaptive difficulty / targeted practice prompts driven by recurring mistakes
- Progress charts or simple streak indicator
- Multiple TTS voices or language-matched voices
- Backend Whisper / Gemini transcription fallback for better accuracy
- Session export
- Dark mode
- Streaming LLM text response (appears as generated)

### OUT OF SCOPE (do not implement)
- WhatsApp, Google Calendar, email, or any external messaging automation
- Reminders, notification systems, or task management
- Computer control, smart-home control, or arbitrary web agents
- Face recognition, emotion detection
- Full multi-language UI localization
- Enterprise SSO or complex role-based access
- Vector database / textbook RAG
- Offline mode or PWA install prompts
- Payment or subscription systems
- Native mobile apps
- Autonomous multi-agent orchestration

---

## 5. Product Features — Detailed

### 5.1 Authentication & User Profile
- Email + password signup and login via Supabase Auth
- Optional display name
- On first successful login the user is prompted to choose target language and proficiency level; these are stored in the `profiles` table
- Logout clears the local session
- Protected routes: Dashboard, Practice, Progress, Settings
- JWT is automatically managed by the Supabase client

### 5.2 Dashboard
- Personalized greeting showing current language and level
- Primary “Start Practice” call-to-action
- Light summary statistics (sessions this week, top recurring mistake category if any)
- List of the five most recent sessions

### 5.3 Practice / Conversation Screen (core UX)
- Large central microphone button with clear visual state
- Live or final transcript area
- “Send” / “Try again” controls
- Tutor response card containing:
  - Corrected sentence (most prominent)
  - Explanation
  - List of grammar issues
  - Vocabulary suggestions
  - Natural alternative phrasing
  - Short encouragement
  - Follow-up question
- Scrollable conversation history of the current session
- Persistent status indicator: 🎤 Listening | 🧠 Thinking | 🔊 Speaking | ⚠️ Error
- Ability to stop TTS playback
- Light session turn counter

### 5.4 Progress & History
- Chronological list of past sessions (date, language, duration, summary of issues)
- Ability to open a past session and review the full transcript + corrections
- “Most common issues” section showing aggregated categories (e.g., Past Tense, Articles, Prepositions)

### 5.5 Settings / Profile
- Change target language
- Change proficiency level
- Preferred browser TTS voice (if available)
- Basic account information

### 5.6 Adaptive Learning (MVP version)
- Every tutor response is tagged by the LLM with 1–3 `mistake_categories`
- Backend maintains a simple count of categories per user
- When a new session starts or a follow-up is generated, the top 2–3 recurring categories are injected into the system prompt so the tutor can gently focus practice
- A simple progress indicator is derived from sessions completed and category coverage

---

## 6. LLM Design (Critical)

### System Prompt Strategy
The system prompt is assembled dynamically at request time:
You are OPTIMUS, a warm, patient, expert language tutor.
Target language: {language}
Learner proficiency: {proficiency}
Recurring focus areas (if any): {top_categories or "none yet"}
On every learner utterance you must:

Understand the intended meaning.
Produce a natural corrected version of the sentence.
Explain the main issues at a level appropriate for the learner.
Suggest better vocabulary or more natural phrasing when helpful.
Give one short, genuine encouragement.
Ask one natural follow-up question that continues the conversation or gently practices a weak area.

Respond ONLY with valid JSON that matches the required schema. Do not add markdown, commentary, or any text outside the JSON object.
text### Structured Output Schema (strict)
```json
{
  "corrected_sentence": "string",
  "grammar_issues": [
    {
      "type": "string",
      "original": "string",
      "correction": "string",
      "explanation": "string"
    }
  ],
  "explanation": "string",
  "vocabulary_suggestions": [
    {
      "original": "string",
      "suggestion": "string",
      "why": "string"
    }
  ],
  "natural_alternative": "string",
  "encouragement": "string",
  "follow_up_question": "string",
  "mistake_categories": ["string"]
}
Implementation Rules

Prefer Gemini’s native JSON / structured-output mode when available.
Validate every response with a Pydantic model.
On validation failure: retry once with a short “return valid JSON only” instruction; if still invalid, fall back to a safe generic helpful response that still contains a corrected sentence.
Maintain the last 6–8 conversation turns in the prompt for continuity.
Truncate older turns if the context window is approached.
Temperature: 0.4–0.6.
Always include the learner’s original transcript in the user message.
Safety: stay in tutor role; refuse harmful requests politely.

Fallback Behavior

LLM timeout or rate-limit → display “The tutor needs a moment. Please try again shortly” while preserving the transcript.
Malformed JSON after retry → template response that still offers a corrected version of the transcript.


7. Speech Pipeline
Recording & Recognition Flow

User clicks the microphone button.
Request navigator.mediaDevices.getUserMedia({ audio: true }).
On success → start Web Speech API recognition (or MediaRecorder if needed).
UI state transitions to LISTENING (visual pulse + optional timer).
On recognition end or manual stop → UI state becomes PROCESSING.
Transcript is shown (optionally editable) and submitted.
Backend receives the transcript, calls the LLM, returns structured feedback.
UI displays the feedback card and transitions to SPEAKING.
Browser SpeechSynthesis speaks the corrected sentence followed by a concise summary of the explanation and the follow-up question.
On speech end → UI returns to IDLE, ready for the next turn.

Browser STT (primary MVP)

window.SpeechRecognition || window.webkitSpeechRecognition
continuous = false, interimResults = true
Language code mapped from the selected target language
Clear onerror handling with user-friendly messages

Browser TTS (primary MVP)

window.speechSynthesis
Prefer a voice that matches the target language when available
Rate ≈ 0.95, pitch 1.0
Previous utterance is cancelled on new speak or user interrupt

Error States that must be handled gracefully

Microphone permission denied
No speech detected
Network offline
Speech recognition unavailable in the browser
LLM failure
TTS not supported by the browser

The user must never see raw stack traces or internal error details.

8. Database Schema (Supabase / PostgreSQL)
profiles













































ColumnTypeNotesiduuid PKreferences auth.users(id)display_nametextnullabletarget_languagetexte.g. "en", "es", "fr", "de", "hi"proficiencytext"beginner" | "intermediate" | "advanced"preferred_voicetextnullablecreated_attimestamptzdefault now()updated_attimestamptz
sessions


















































ColumnTypeNotesiduuid PKuser_iduuid FKprofiles.idlanguagetextproficiencytextstarted_attimestamptzdefault now()ended_attimestamptznullableturn_countintegerdefault 0summarytextnullable
messages








































ColumnTypeNotesiduuid PKsession_iduuid FKroletext"user" | "tutor"contenttextoriginal transcript or spoken textstructured_feedbackjsonbfull LLM JSON (tutor turns only)created_attimestamptzdefault now()
corrections


















































ColumnTypeNotesiduuid PKuser_iduuid FKsession_iduuid FKmessage_iduuid FKoriginal_texttextcorrected_texttextcategoriestext[]created_attimestamptzdefault now()
Row Level Security (mandatory)

Every table must have policies that restrict SELECT, INSERT, UPDATE, and DELETE to rows where auth.uid() = user_id (or the equivalent join through session ownership). The service-role key is used only on the backend for any necessary aggregates.
Useful indexes:

sessions(user_id, started_at DESC), messages(session_id, created_at), corrections(user_id, categories).

9. API Design (FastAPI)
Base path: /api/v1

Authentication: Bearer JWT issued by Supabase; validated on every protected route.

Common response shape:
JSON{
  "success": true,
  "data": {},
  "error": null
}
Key Endpoints
POST /api/v1/sessions

Create a new practice session.

Body: { "language": "en", "proficiency": "intermediate" }

Returns the created session object.
GET /api/v1/sessions

List the current user’s sessions (most recent first, paginated).
GET /api/v1/sessions/{session_id}

Return a single session with its messages.
PATCH /api/v1/sessions/{session_id}/end

Mark the session as ended.
POST /api/v1/tutor/analyze

Core tutor endpoint.

Body: { "session_id": "uuid", "transcript": "string" }

Side effects: insert user message, call LLM, insert tutor message + corrections, update category counts.

Returns the full structured feedback object.
GET /api/v1/progress

Return aggregated statistics and top recurring mistake categories for the current user.
GET /api/v1/profile / PATCH /api/v1/profile

Read or update display name, language, proficiency, preferred voice.
GET /health

Public health check: { "status": "ok", "version": "1.0" }
Error codes used consistently: 400 (validation), 401 (unauthenticated), 403 (forbidden), 404, 429 (rate limit), 500 (safe generic message).

10. Frontend Architecture
textfrontend/
  src/
    components/
      auth/
      layout/
      practice/
        MicButton.tsx
        StatusIndicator.tsx
        TranscriptBox.tsx
        FeedbackCard.tsx
        ConversationHistory.tsx
      progress/
      ui/                 # reusable primitives
    pages/
      Landing.tsx
      Login.tsx
      Signup.tsx
      Dashboard.tsx
      Practice.tsx
      Progress.tsx
      Settings.tsx
    hooks/
      useSpeechRecognition.ts
      useSpeechSynthesis.ts
      useTutorSession.ts
    lib/
      supabase.ts
      api.ts
      schemas.ts          # Zod schemas
    stores/
      authStore.ts
    App.tsx
    main.tsx
  index.html
  package.json
  vite.config.ts
  tailwind.config.js
UI/UX principles

Mobile-first responsive layout
Large, obvious microphone touch target
Clear visual hierarchy (corrected sentence is the most prominent element)
Skeleton or spinner states while processing
Helpful empty states
Accessible labels and ARIA attributes for microphone states
Clean modern aesthetic (soft neutrals + indigo/violet accent)


11. Backend Architecture
textbackend/
  app/
    main.py
    api/
      deps.py             # JWT / user dependency
      routes/
        health.py
        profile.py
        sessions.py
        tutor.py
    core/
      config.py
      security.py
    services/
      llm.py              # Gemini client, prompt assembly, schema validation, retry
      progress.py         # category aggregation
    models/
      schemas.py          # Pydantic models
    db/
      supabase.py
  tests/
  requirements.txt
  .env.example
Business logic lives in services; route handlers stay thin.

12. Error Handling Matrix























































ScenarioUser-facing messageRecovery actionMicrophone permission denied“Microphone access is required to practice speaking.”Stay in Idle, show help textNo speech detected“I didn’t catch that. Please try again.”Return to IdleSpeech recognition unavailable“Speech recognition is not supported in this browser. You can type instead.”Offer text fallbackNetwork offline“You appear to be offline. Check your connection.”Disable send buttonLLM timeout / 5xx“The tutor is taking a short break. Please try again.”Keep transcript, allow retryInvalid LLM JSON after retryGeneric helpful correction of the transcriptContinue sessionTTS not supportedText feedback still shown; note that audio is unavailableContinue without audioAuthentication expiredRedirect to login—Rate limit“Too many requests. Please wait a moment.”Temporarily disable send

13. Security Requirements

All secrets live in environment variables or Supabase secrets; never in source code or the frontend bundle.
Frontend receives only the Supabase anon key.
Every protected endpoint validates the JWT and extracts user_id.
Row Level Security is enabled and correctly written on every table.
Input length limits (transcript ≤ 500 characters) and basic sanitization.
CORS restricted to explicitly listed origins.
Simple rate limiting on the analyze endpoint.
No sensitive data written to application logs.
HTTPS only in production.


14. Testing Strategy
Automated (minimum)

Pydantic schema validation of LLM responses
Category aggregation logic
Authentication required on protected routes
Happy-path analyze endpoint

Manual Demo Checklist (must pass before submission)

Sign up → choose language and level → reach dashboard.
Start a practice session → grant microphone → speak an incorrect sentence (e.g. “Yesterday I go to the store and buy many thing”).
Observe transcript → receive structured feedback card → hear TTS of the correction.
Answer the follow-up question by voice → conversation continues with context.
End the session → see it appear on the Progress page with relevant categories.
Log out and log back in → data is still present and isolated to the user.
Deny microphone permission → clear, helpful message appears.
Simulate offline → clear error state.
Verify the interface remains usable on a mobile viewport.


15. Evaluation Criteria Mapping






















































CriterionWhat the evaluator looks forOPTIMUS implementationHow it is demonstratedRisk if missing1. End-to-End FunctionalityFull pipeline runs (audio in → LLM out)Browser STT → FastAPI → Gemini → structured feedback → TTS + DBLive speak → correction spoken and displayedCritical2. Thoughtful LLM UsePrompting, schema, error handling, edge casesDynamic system prompt, strict JSON schema, retry, categoriesStructured feedback card + adaptive focus visibleMedium3. Speech-Handling QualityAccuracy, latency, noisy/unclear audio handlingBrowser STT + explicit UI states + graceful error pathsLive microphone demo + error-state walkthroughHigh4. Code Quality & StructureReadable, modular, extensibleClean frontend/backend separation, services, typed schemasRepository structure and code walk-throughMedium5. DocumentationSetup, approach, assumptions, known limitationsComplete README + this specificationREADME opened during reviewHigh6. Creativity / Stretch GoalsGoing beyond core requirementsRecurring-mistake tracking, adaptive prompt injection, polished UXProgress page + personalized follow-up questionsBonus

16. Recommended 60–90 Second Demo Script

Open the deployed application (already logged in or quick login).
Dashboard shows current language and level → click “Start Practice”.
Click the microphone → speak: “Yesterday I go to the store and buy many thing.”
Transcript appears → status shows Processing.
Feedback card appears with corrected sentence, tense and plural explanations, vocabulary suggestion, encouragement, and a follow-up question.
TTS speaks the correction and a short summary.
User answers the follow-up by voice; conversation continues.
Navigate to Progress → the session and “Past Tense” (or similar) category are visible.


17. Greenfield Implementation Roadmap
All work assumes an empty repository. No legacy code exists.
PHASE 1 — Project Foundation

Objective: Both applications start cleanly.

Tasks: Initialize Vite React TypeScript frontend, FastAPI backend, shared .env.example, health endpoint, CORS, basic Tailwind setup.

Dependencies: None.

Definition of Done: npm run dev and uvicorn both succeed; /health returns 200.

Tests: Health check.
PHASE 2 — Authentication

Objective: Users can register, log in, and log out.

Tasks: Supabase project, email/password auth, protected route wrapper, login/signup pages, auth store.

Dependencies: Phase 1.

Definition of Done: New user can sign up, log in, reach a protected page, and log out.

Tests: Auth flow manual + protected route returns 401 when unauthenticated.
PHASE 3 — Database

Objective: Core tables and RLS exist.

Tasks: Create profiles, sessions, messages, corrections tables; write RLS policies; profile creation on first login; language/proficiency selection screen.

Dependencies: Phase 2.

Definition of Done: Profile is created and can be read/updated; RLS prevents cross-user access.

Tests: RLS isolation verified with two test users.
PHASE 4 — AI Tutor Service

Objective: Reliable structured LLM responses.

Tasks: Gemini client, dynamic system prompt, Pydantic schema, validation + single retry, fallback response.

Dependencies: Phase 1.

Definition of Done: Given a transcript string, the service returns valid structured JSON or a safe fallback.

Tests: Schema validation unit tests; malformed response handling.
PHASE 5 — Text Conversation

Objective: Full text-based tutor loop with persistence.

Tasks: Session create/list/end endpoints, analyze endpoint that saves messages and corrections, basic Practice page that works with typed input.

Dependencies: Phases 3 & 4.

Definition of Done: User can start a session, type a sentence, receive structured feedback, and see history.

Tests: End-to-end text analyze happy path.
PHASE 6 — Speech Input

Objective: Microphone → transcript.

Tasks: useSpeechRecognition hook, MicButton with Idle/Listening/Processing states, permission and error handling, optional transcript editing.

Dependencies: Phase 5.

Definition of Done: Speaking into the microphone produces a transcript that can be submitted.

Tests: Permission denied and no-speech paths.
PHASE 7 — Speech Output

Objective: Tutor response is spoken.

Tasks: useSpeechSynthesis hook, automatic TTS of corrected sentence + summary, interrupt/stop control, Speaking state.

Dependencies: Phase 6.

Definition of Done: Complete voice loop (speak → feedback → hear response) works.

Tests: TTS cancellation and unsupported-browser path.
PHASE 8 — Conversation Context

Objective: Multi-turn continuity.

Tasks: Keep last N turns in the LLM prompt, display full conversation history in the UI.

Dependencies: Phase 7.

Definition of Done: Follow-up questions and subsequent answers maintain context.

Tests: Multi-turn manual demo.
PHASE 9 — Progress Tracking

Objective: History and basic analytics visible.

Tasks: Progress page, session list with details, simple category aggregation endpoint and UI.

Dependencies: Phase 5.

Definition of Done: Past sessions and top mistake categories are visible.

Tests: Data appears after several practice turns.
PHASE 10 — Adaptive Learning

Objective: Tutor gently focuses on recurring issues.

Tasks: Inject top categories into system prompt on new sessions and follow-ups.

Dependencies: Phase 9.

Definition of Done: When a user has repeated a category, subsequent prompts mention it and the tutor behaves accordingly.

Tests: Manual observation with seeded categories.
PHASE 11 — UI Polish

Objective: Professional, responsive appearance.

Tasks: Spacing, typography, loading skeletons, empty states, mobile layout, status indicator refinements.

Dependencies: All previous.

Definition of Done: Application looks polished on desktop and mobile; no obvious visual bugs.

Tests: Responsive checklist.
PHASE 12 — Testing & Hardening

Objective: Reliability for demo.

Tasks: Run full manual demo checklist, fix remaining edge cases, add any missing error messages.

Dependencies: Phase 11.

Definition of Done: Manual demo checklist passes cleanly.

Tests: Full checklist.
PHASE 13 — Deployment

Objective: Publicly reachable demo.

Tasks: Deploy frontend to Vercel, backend to Railway/Render, set production environment variables, verify CORS and health.

Dependencies: Phase 12.

Definition of Done: Live URL works for the demo script.

Tests: Production smoke test.
PHASE 14 — Documentation

Objective: Submission-ready repository.

Tasks: Complete README (setup, approach, assumptions, known limitations, AI-assistant note), final commit, verify .env.example.

Dependencies: All previous.

Definition of Done: A new developer can follow the README and run the project locally.

Tests: Fresh clone + setup dry-run.
Stretch features are scheduled only if all P0 phases are complete with at least two hours remaining.

18. Git / Commit Strategy
Work is committed incrementally with clear, meaningful messages. Example sequence:

chore: initialize frontend (Vite React TS) and backend (FastAPI)
feat(backend): health check, config, and CORS
feat(frontend): routing, layout shell, Tailwind
feat(auth): Supabase authentication and protected routes
feat(db): profiles, sessions, messages, corrections + RLS
feat(llm): Gemini structured tutor service with validation
feat(api): session and tutor/analyze endpoints
feat(practice): text-based conversation UI
feat(speech): Web Speech recognition and microphone states
feat(tts): browser speech synthesis playback
feat(progress): history page and category aggregation
feat(adaptive): inject recurring categories into prompt
style: UI polish and responsive refinements
docs: complete README and environment example
chore: deployment configuration and final cleanup

Do not create artificial commits solely to increase count.

19. Deployment

Frontend → Vercel (connected to the GitHub repository)
Backend → Railway or Render (Python / Docker)
Database → Supabase (already hosted)
Production environment variables set in each platform’s dashboard
CORS_ORIGINS includes the production frontend URL
Health endpoint used for platform health checks
Production frontend build: npm run build


20. Final Acceptance Checklist
Functionality

 Complete voice loop works: speak → STT → LLM → structured feedback → TTS
 Multi-turn conversation maintains context
 Sessions and messages are persisted per user

AI

 LLM returns valid structured JSON matching the defined schema
 Corrected sentence, explanation, vocabulary suggestions, natural alternative, encouragement, and follow-up are all present
 Mistake categories are extracted and stored
 Prompt is aware of proficiency level and conversation history

Voice

 Clear Idle / Listening / Processing / Speaking / Error states
 Microphone permission and no-speech cases handled gracefully
 TTS can be interrupted by the user

Authentication & Security

 Registration, login, and logout work
 Users can access only their own data (RLS verified)
 No secrets appear in frontend code or the repository

Database

 All required tables exist with correct relationships
 RLS policies are active and correct

Personalization

 Language and proficiency are selectable and stored
 Top mistake categories appear on the Progress page
 Categories influence subsequent tutor behavior

UI/UX

 Modern, polished appearance; usable on mobile
 Feedback card hierarchy is clear
 Empty and error states exist

Quality & Process

 Manual demo checklist passes
 No console errors on the happy path
 Code is modular and readable
 README contains setup, approach, assumptions, known limitations, and AI-assistant note
 Incremental commits with meaningful messages
.env.example is present and accurate

Deployment (strongly recommended)

 Frontend and backend are publicly reachable
 Health check returns 200 in production

Demo Ready

 The 60–90 second live demo script runs smoothly

A feature is considered complete only when it is implemented, integrated, tested, usable, and (where relevant) documented.

Final Acceptance Checklist
(See section 20 above — this is the authoritative list used at submission time.)

Codex Execution Protocol

Read this entire spec.md before writing any code.
Treat spec.md as the single source of truth. Do not invent requirements.
Build the entire project from scratch in a new repository. Do not search for, assume, or reference any previous project.
Do not implement any feature that is listed as Out of Scope.
Implement strictly in the order of the greenfield roadmap (Phases 1–14). Complete each phase’s Definition of Done before moving forward.
After every major phase, run the relevant tests or manual checks and make a clear commit.
Never expose secrets. Use environment variables exclusively.
Prefer simple, reliable solutions over technically impressive but fragile ones.
Keep frontend and backend cleanly separated.
Validate every external API response, especially LLM JSON.
Do not begin any Stretch (P1) work until all Must-Have (P0) acceptance criteria pass.
Update the README whenever architecture or setup instructions change.
If any requirement is ambiguous, choose the simplest interpretation that still satisfies the internship evaluation criteria and record the assumption in the README.
At the end the application must support the recommended 60–90 second live demo without surprises.
