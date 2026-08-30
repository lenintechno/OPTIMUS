from datetime import UTC, datetime, timedelta

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.routes.sessions import get_profile_service, get_session_service
from app.core.security import AuthenticatedUser, get_current_user
from app.main import app
from app.models.schemas import (
    CorrectionCreate,
    PracticeMessage,
    PracticeSession,
    Profile,
    SessionCreate,
)
from app.services.session import SessionService

USER_ID = "11111111-1111-4111-8111-111111111111"
SESSION_ID_1 = "22222222-2222-4222-8222-222222222222"
SESSION_ID_2 = "33333333-3333-4333-8333-333333333333"


class MockSessionRepository:
    def __init__(self) -> None:
        now = datetime.now(UTC)
        self.sessions: list[PracticeSession] = [
            PracticeSession(
                id=SESSION_ID_1,
                user_id=USER_ID,
                language="en",
                proficiency="intermediate",
                started_at=now - timedelta(minutes=10),
                ended_at=now - timedelta(minutes=2),
                turn_count=4,
            ),
            PracticeSession(
                id=SESSION_ID_2,
                user_id=USER_ID,
                language="en",
                proficiency="intermediate",
                started_at=now - timedelta(days=1),
                ended_at=now - timedelta(days=1, minutes=-15),
                turn_count=6,
            ),
        ]
        self.corrections = [
            {"id": "c1", "categories": ["Subject-Verb Agreement", "Articles"], "created_at": now.isoformat()},
            {"id": "c2", "categories": ["Articles", "Prepositions"], "created_at": now.isoformat()},
            {"id": "c3", "categories": ["Subject-Verb Agreement"], "created_at": now.isoformat()},
        ]

    async def create_session(self, user_id: str, access_token: str, session: SessionCreate) -> PracticeSession:
        raise NotImplementedError

    async def list_sessions(self, access_token: str, limit: int, offset: int) -> list[PracticeSession]:
        return self.sessions[offset : offset + limit]

    async def get_session(self, access_token: str, session_id: str) -> PracticeSession | None:
        return next((s for s in self.sessions if s.id == session_id), None)

    async def get_messages(self, access_token: str, session_id: str) -> list[PracticeMessage]:
        return []

    async def end_session(self, access_token: str, session_id: str, ended_at: datetime) -> PracticeSession | None:
        return None

    async def add_message(self, access_token: str, **kwargs) -> PracticeMessage:
        raise NotImplementedError

    async def add_correction(self, access_token: str, correction: CorrectionCreate) -> None:
        raise NotImplementedError

    async def list_corrections(self, access_token: str) -> list[dict]:
        return self.corrections

    async def increment_turn_count(self, access_token: str, session: PracticeSession) -> PracticeSession | None:
        return None


class MockProfileService:
    async def get_profile(self, user_id: str, access_token: str) -> Profile | None:
        return Profile(
            id=USER_ID,
            display_name="Alex",
            target_language="en",
            proficiency="intermediate",
            preferred_voice=None,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )


@pytest.mark.anyio
async def test_get_progress_endpoint():
    repo = MockSessionRepository()
    session_service = SessionService(repo)
    profile_service = MockProfileService()

    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(id=USER_ID, access_token="test-token")
    app.dependency_overrides[get_session_service] = lambda: session_service
    app.dependency_overrides[get_profile_service] = lambda: profile_service

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/v1/sessions/progress")
            assert response.status_code == 200
            data = response.json()["data"]

            assert data["total_sessions"] == 2
            assert data["total_sentences"] == 10  # 4 + 6
            assert data["total_corrections"] == 3
            assert data["current_level"] == "intermediate"
            assert data["target_language"] == "en"
            assert data["streak_days"] == 2  # today + yesterday
            assert len(data["common_mistakes"]) > 0

            # Articles has 2 counts, Subject-Verb Agreement has 2 counts
            categories_map = {m["category"]: m["count"] for m in data["common_mistakes"]}
            assert categories_map["Subject-Verb Agreement"] == 2
            assert categories_map["Articles"] == 2
            assert categories_map["Prepositions"] == 1

            assert len(data["recent_sessions"]) == 2
            assert data["recent_sessions"][0]["turn_count"] == 4
    finally:
        app.dependency_overrides.clear()
