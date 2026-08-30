# OPTIMUS

OPTIMUS is an AI voice language tutor. This repository currently contains Phases 1-4: the application foundation, Supabase authentication and profile onboarding, and the structured Gemini tutor service.

## Current scope

- React, TypeScript, Vite, and Tailwind CSS setup
- FastAPI configuration and restricted CORS
- Public `GET /health` endpoint
- Supabase email/password sign-up, sign-in, sign-out, and protected frontend route
- Protected backend authentication smoke-test endpoint
- Versioned Supabase migration for profiles, sessions, messages, and corrections, including indexes, constraints, and RLS policies
- Protected profile API and an onboarding gate for target language and proficiency selection
- Gemini tutor service with native JSON mode, strict Pydantic validation, one repair retry, and a safe malformed-response fallback
- Environment variable templates and foundation/authentication tests

Tutor HTTP endpoints, practice sessions, speech features, and progress tracking are deliberately deferred to later approved phases.

## Prerequisites

- Node.js 22+
- Python 3.11+

## Local setup

1. Create a Supabase project and enable the Email provider. Add `http://localhost:5173` as the local Site URL and redirect URL.
2. Apply the Phase 3 migration at `supabase/migrations/202608290001_phase3_core_tables.sql` with the Supabase CLI (`supabase db push`) or the Supabase SQL editor. This enables the required tables and RLS policies; do not create these tables manually.
3. Copy the root `.env.example` to `.env`. This file is loaded by the backend and is for server configuration only. Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `GEMINI_API_KEY`; select a supported `GEMINI_MODEL` for your Gemini project. Never add `VITE_` variables or browser-exposed values to it. `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` remain backend-only.
4. Copy `frontend/.env.example` to `frontend/.env`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the same project values. Vite loads this file, and it must contain only public `VITE_` variables. Never put `SUPABASE_SERVICE_ROLE_KEY`, Gemini keys, or other server secrets in it.
5. If email confirmation is enabled in Supabase, confirm the sign-up email before signing in.
6. Install frontend dependencies:

   ```bash
   cd frontend
   npm install
   ```

7. Create a backend environment and install dependencies:

   ```bash
   cd backend
   python3 -m venv .venv
   . .venv/bin/activate
   pip install -r requirements.txt
   ```

## Run locally

In separate terminals:

```bash
cd frontend
npm run dev
```

```bash
cd backend
. .venv/bin/activate
uvicorn app.main:app --reload
```

The frontend defaults to `http://localhost:5173`. The API health endpoint is `http://localhost:8000/health`.

## Verification

```bash
cd frontend && npm run build
cd backend && . .venv/bin/activate && pytest
```

## Phase 3 behavior

After authentication, users without a `profiles` row are required to select one of English, Spanish, French, German, or Hindi and a Beginner, Intermediate, or Advanced proficiency level. The frontend sends the access token only to the protected FastAPI profile API. That API queries Supabase using the caller's JWT, so the migration's RLS policies enforce ownership in addition to API authentication.

The migration also prepares sessions, messages, and corrections for later approved phases. This phase deliberately does not expose session, tutor, speech, or progress APIs/UI.

### Optional live RLS verification

Create two confirmed test users, complete onboarding for both, then set `SUPABASE_RLS_TEST_USER_A_JWT`, `SUPABASE_RLS_TEST_USER_B_JWT`, `SUPABASE_RLS_TEST_USER_A_ID`, and `SUPABASE_RLS_TEST_USER_B_ID` alongside `SUPABASE_URL` and `SUPABASE_ANON_KEY`. Run `cd backend && pytest tests/test_rls_isolation.py`. It verifies that one user cannot read the other user's profile, session, message, or correction rows and deletes its temporary test session.

## Phase 4 behavior

The backend-only tutor service constructs a language-, proficiency-, and recurring-category-aware system prompt. It includes only the latest eight conversation turns, requires Gemini JSON output matching the Pydantic `TutorFeedback` schema, retries once when that output is malformed, and then returns a safe template response. Gemini outages, timeouts, and rate limits surface the safe message: “The tutor needs a moment. Please try again shortly.” The `/api/v1/tutor/analyze` endpoint is intentionally deferred to Phase 5.

## Current limitations

Practice-session persistence, tutor HTTP endpoints, browser speech recognition, text-to-speech, and progress views are deliberately deferred to later approved phases. Any AI coding-assistant use will be noted in the final submission documentation.
