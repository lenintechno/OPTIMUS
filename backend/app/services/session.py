"""Session persistence, text tutor loop, and learning progress analytics."""

from collections import Counter
from datetime import UTC, datetime, timedelta
from typing import Any, Protocol

from app.db.supabase import SupabaseRestClient
from app.models.schemas import (
    CorrectionCreate,
    GrammarCategoryCount,
    PracticeMessage,
    PracticeSession,
    Profile,
    ProgressSummary,
    RecentSessionItem,
    SessionCreate,
    SessionDetail,
    SessionPage,
    TutorAnalysisInput,
    TutorFeedback,
)
from app.services.llm import TutorService


class SessionRepository(Protocol):
    async def create_session(self, user_id: str, access_token: str, session: SessionCreate) -> PracticeSession: ...

    async def list_sessions(self, access_token: str, limit: int, offset: int) -> list[PracticeSession]: ...

    async def get_session(self, access_token: str, session_id: str) -> PracticeSession | None: ...

    async def get_messages(self, access_token: str, session_id: str) -> list[PracticeMessage]: ...

    async def end_session(self, access_token: str, session_id: str, ended_at: datetime) -> PracticeSession | None: ...

    async def add_message(
        self,
        access_token: str,
        *,
        session_id: str,
        role: str,
        content: str,
        structured_feedback: dict[str, object] | None = None,
    ) -> PracticeMessage: ...

    async def add_correction(self, access_token: str, correction: CorrectionCreate) -> None: ...

    async def list_corrections(self, access_token: str) -> list[dict[str, Any]]: ...

    async def increment_turn_count(self, access_token: str, session: PracticeSession) -> PracticeSession | None: ...


class SupabaseSessionRepository:
    """Session data access using the caller's JWT, so Supabase RLS stays on."""

    def __init__(self, client: SupabaseRestClient) -> None:
        self._client = client

    async def create_session(self, user_id: str, access_token: str, session: SessionCreate) -> PracticeSession:
        rows = await self._client.request(
            "POST",
            "sessions",
            access_token,
            json={"user_id": user_id, **session.model_dump()},
            headers={"Prefer": "return=representation"},
        )
        return PracticeSession.model_validate(rows[0])

    async def list_sessions(self, access_token: str, limit: int, offset: int) -> list[PracticeSession]:
        rows = await self._client.request(
            "GET",
            "sessions",
            access_token,
            params={"select": "*", "order": "started_at.desc", "limit": str(limit), "offset": str(offset)},
        )
        return [PracticeSession.model_validate(row) for row in rows]

    async def get_session(self, access_token: str, session_id: str) -> PracticeSession | None:
        rows = await self._client.request(
            "GET", "sessions", access_token, params={"id": f"eq.{session_id}", "select": "*"}
        )
        return PracticeSession.model_validate(rows[0]) if rows else None

    async def get_messages(self, access_token: str, session_id: str) -> list[PracticeMessage]:
        rows = await self._client.request(
            "GET",
            "messages",
            access_token,
            params={"session_id": f"eq.{session_id}", "select": "*", "order": "created_at.asc"},
        )
        return [PracticeMessage.model_validate(row) for row in rows]

    async def end_session(self, access_token: str, session_id: str, ended_at: datetime) -> PracticeSession | None:
        rows = await self._client.request(
            "PATCH",
            "sessions",
            access_token,
            params={"id": f"eq.{session_id}"},
            json={"ended_at": ended_at.isoformat()},
            headers={"Prefer": "return=representation"},
        )
        return PracticeSession.model_validate(rows[0]) if rows else None

    async def add_message(
        self,
        access_token: str,
        *,
        session_id: str,
        role: str,
        content: str,
        structured_feedback: dict[str, object] | None = None,
    ) -> PracticeMessage:
        payload: dict[str, object] = {"session_id": session_id, "role": role, "content": content}
        if structured_feedback is not None:
            payload["structured_feedback"] = structured_feedback
        rows = await self._client.request(
            "POST", "messages", access_token, json=payload, headers={"Prefer": "return=representation"}
        )
        return PracticeMessage.model_validate(rows[0])

    async def add_correction(self, access_token: str, correction: CorrectionCreate) -> None:
        await self._client.request(
            "POST",
            "corrections",
            access_token,
            json=correction.model_dump(),
            headers={"Prefer": "return=representation"},
        )

    async def list_corrections(self, access_token: str) -> list[dict[str, Any]]:
        rows = await self._client.request(
            "GET",
            "corrections",
            access_token,
            params={"select": "id,categories,created_at", "order": "created_at.desc", "limit": "200"},
        )
        return rows

    async def increment_turn_count(self, access_token: str, session: PracticeSession) -> PracticeSession | None:
        rows = await self._client.request(
            "PATCH",
            "sessions",
            access_token,
            params={"id": f"eq.{session.id}"},
            json={"turn_count": session.turn_count + 1},
            headers={"Prefer": "return=representation"},
        )
        return PracticeSession.model_validate(rows[0]) if rows else None


class SessionService:
    """Coordinates user-owned sessions, messages, corrections, and Gemini."""

    def __init__(self, repository: SessionRepository) -> None:
        self._repository = repository

    async def create_session(self, user_id: str, access_token: str, session: SessionCreate) -> PracticeSession:
        return await self._repository.create_session(user_id, access_token, session)

    async def list_sessions(self, access_token: str, limit: int, offset: int) -> SessionPage:
        sessions = await self._repository.list_sessions(access_token, limit, offset)
        return SessionPage(items=sessions, limit=limit, offset=offset)

    async def get_session_detail(self, access_token: str, session_id: str) -> SessionDetail | None:
        session = await self._repository.get_session(access_token, session_id)
        if session is None:
            return None
        messages = await self._repository.get_messages(access_token, session.id)
        return SessionDetail(session=session, messages=messages)

    async def end_session(self, access_token: str, session_id: str) -> PracticeSession | None:
        return await self._repository.end_session(access_token, session_id, datetime.now(UTC))

    async def analyze_text(
        self,
        *,
        user_id: str,
        access_token: str,
        session_id: str,
        transcript: str,
        tutor: TutorService,
    ) -> TutorFeedback | None:
        session = await self._repository.get_session(access_token, session_id)
        if session is None or session.ended_at is not None:
            return None

        await self._repository.add_message(
            access_token,
            session_id=session.id,
            role="user",
            content=transcript,
        )
        feedback = await tutor.analyze(
            TutorAnalysisInput(transcript=transcript, language=session.language, proficiency=session.proficiency)
        )
        tutor_message = await self._repository.add_message(
            access_token,
            session_id=session.id,
            role="tutor",
            content=feedback.corrected_sentence,
            structured_feedback=feedback.model_dump(mode="json"),
        )
        await self._repository.add_correction(
            access_token,
            CorrectionCreate(
                user_id=user_id,
                session_id=session.id,
                message_id=tutor_message.id,
                original_text=transcript,
                corrected_text=feedback.corrected_sentence,
                categories=feedback.mistake_categories,
            ),
        )
        await self._repository.increment_turn_count(access_token, session)
        return feedback

    async def get_progress(
        self,
        user_id: str,
        access_token: str,
        *,
        profile: Profile | None = None,
    ) -> ProgressSummary:
        """Calculates actual learning progress metrics from persisted user data."""
        sessions = await self._repository.list_sessions(access_token, limit=100, offset=0)
        corrections = await self._repository.list_corrections(access_token)

        total_sessions = len(sessions)
        total_sentences = sum(s.turn_count for s in sessions)
        total_corrections = len(corrections)

        current_level = profile.proficiency if profile else (sessions[0].proficiency if sessions else "beginner")
        target_language = profile.target_language if profile else (sessions[0].language if sessions else "en")

        # Compute recurring mistake category counts
        category_counts: Counter[str] = Counter()
        for corr in corrections:
            raw_cats = corr.get("categories", [])
            if isinstance(raw_cats, list):
                for cat in raw_cats:
                    if isinstance(cat, str) and cat.strip():
                        category_counts[cat.strip()] += 1

        common_mistakes = [
            GrammarCategoryCount(category=cat, count=cnt)
            for cat, cnt in category_counts.most_common(6)
        ]

        # Compute practice streak from distinct session dates
        streak_days = 0
        if sessions:
            active_dates = sorted(
                {s.started_at.date() for s in sessions},
                reverse=True,
            )
            today = datetime.now(UTC).date()
            if active_dates:
                if active_dates[0] == today:
                    streak_days = 1
                    check_date = today - timedelta(days=1)
                elif active_dates[0] == today - timedelta(days=1):
                    streak_days = 1
                    check_date = today - timedelta(days=2)
                else:
                    streak_days = 0
                    check_date = None

                if check_date:
                    for d in active_dates[1:]:
                        if d == check_date:
                            streak_days += 1
                            check_date -= timedelta(days=1)
                        elif d < check_date:
                            break

        # Build recent sessions summary
        recent_sessions: list[RecentSessionItem] = []
        for s in sessions[:10]:
            duration_seconds = None
            if s.ended_at and s.started_at:
                duration_seconds = max(0, int((s.ended_at - s.started_at).total_seconds()))
            recent_sessions.append(
                RecentSessionItem(
                    id=s.id,
                    language=s.language,
                    proficiency=s.proficiency,
                    started_at=s.started_at,
                    ended_at=s.ended_at,
                    turn_count=s.turn_count,
                    duration_seconds=duration_seconds,
                )
            )

        return ProgressSummary(
            total_sessions=total_sessions,
            total_sentences=total_sentences,
            total_corrections=total_corrections,
            current_level=current_level,
            target_language=target_language,
            streak_days=streak_days,
            common_mistakes=common_mistakes,
            recent_sessions=recent_sessions,
        )

