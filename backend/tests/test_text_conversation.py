from datetime import UTC, datetime

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.routes.sessions import get_session_service
from app.api.routes.tutor import get_tutor_service
from app.core.security import AuthenticatedUser, get_current_user
from app.main import app
from app.models.schemas import (
    CorrectionCreate,
    PracticeMessage,
    PracticeSession,
    SessionCreate,
    TutorAnalysisInput,
    TutorFeedback,
)
from app.services.session import SessionService

USER_ID = "11111111-1111-4111-8111-111111111111"
SESSION_ID = "22222222-2222-4222-8222-222222222222"

FEEDBACK = TutorFeedback.model_validate(
    {
        "corrected_sentence": "Yesterday I went to the store and bought many things.",
        "grammar_issues": [{"type": "Past tense", "original": "go", "correction": "went", "explanation": "Yesterday needs a past-tense verb."}],
        "explanation": "Use past tense for completed actions.",
        "vocabulary_suggestions": [{"original": "many thing", "suggestion": "many things", "why": "Use a plural noun after many."}],
        "natural_alternative": "I went shopping yesterday and bought several things.",
        "encouragement": "You expressed a clear idea.",
        "follow_up_question": "What did you buy?",
        "mistake_categories": ["Past Tense", "Plural Nouns"],
    }
)


class InMemorySessionRepository:
    def __init__(self) -> None:
        self.sessions: dict[str, PracticeSession] = {}
        self.messages: list[PracticeMessage] = []
        self.corrections: list[CorrectionCreate] = []

    async def create_session(self, user_id: str, access_token: str, session: SessionCreate) -> PracticeSession:
        assert user_id == USER_ID and access_token == "test-token"
        created = PracticeSession(
            id=SESSION_ID,
            user_id=user_id,
            language=session.language,
            proficiency=session.proficiency,
            started_at=datetime.now(UTC),
            turn_count=0,
        )
        self.sessions[created.id] = created
        return created

    async def list_sessions(self, access_token: str, limit: int, offset: int) -> list[PracticeSession]:
        assert access_token == "test-token"
        return list(self.sessions.values())[offset:offset + limit]

    async def get_session(self, access_token: str, session_id: str) -> PracticeSession | None:
        assert access_token == "test-token"
        return self.sessions.get(session_id)

    async def get_messages(self, access_token: str, session_id: str) -> list[PracticeMessage]:
        assert access_token == "test-token"
        return [message for message in self.messages if message.session_id == session_id]

    async def end_session(self, access_token: str, session_id: str, ended_at: datetime) -> PracticeSession | None:
        session = self.sessions.get(session_id)
        if session is None:
            return None
        ended = session.model_copy(update={"ended_at": ended_at})
        self.sessions[session_id] = ended
        return ended

    async def add_message(
        self,
        access_token: str,
        *,
        session_id: str,
        role: str,
        content: str,
        structured_feedback: dict[str, object] | None = None,
    ) -> PracticeMessage:
        message = PracticeMessage(
            id=f"message-{len(self.messages) + 1}",
            session_id=session_id,
            role=role,
            content=content,
            structured_feedback=structured_feedback,
            created_at=datetime.now(UTC),
        )
        self.messages.append(message)
        return message

    async def add_correction(self, access_token: str, correction: CorrectionCreate) -> None:
        self.corrections.append(correction)

    async def increment_turn_count(self, access_token: str, session: PracticeSession) -> PracticeSession | None:
        updated = session.model_copy(update={"turn_count": session.turn_count + 1})
        self.sessions[session.id] = updated
        return updated


class FakeTutorService:
    def __init__(self) -> None:
        self.requests: list[TutorAnalysisInput] = []

    async def analyze(self, request: TutorAnalysisInput) -> TutorFeedback:
        self.requests.append(request)
        return FEEDBACK


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture
def repository() -> InMemorySessionRepository:
    return InMemorySessionRepository()


@pytest.fixture
def tutor() -> FakeTutorService:
    return FakeTutorService()


@pytest.fixture(autouse=True)
def override_dependencies(repository: InMemorySessionRepository, tutor: FakeTutorService):
    async def current_user() -> AuthenticatedUser:
        return AuthenticatedUser(id=USER_ID, email="learner@example.com", access_token="test-token")

    async def session_service() -> SessionService:
        return SessionService(repository)

    async def tutor_service() -> FakeTutorService:
        return tutor

    app.dependency_overrides[get_current_user] = current_user
    app.dependency_overrides[get_session_service] = session_service
    app.dependency_overrides[get_tutor_service] = tutor_service
    yield
    app.dependency_overrides.clear()


@pytest.mark.anyio
async def test_text_analyze_happy_path_persists_both_messages_and_correction(repository: InMemorySessionRepository, tutor: FakeTutorService) -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        created = await client.post("/api/v1/sessions", json={"language": "en", "proficiency": "intermediate"})
        session_id = created.json()["data"]["id"]
        analyzed = await client.post("/api/v1/tutor/analyze", json={"session_id": session_id, "transcript": "Yesterday I go to the store and buy many thing"})
        detail = await client.get(f"/api/v1/sessions/{session_id}")

    assert created.status_code == 201
    assert analyzed.status_code == 200
    assert analyzed.json()["data"]["corrected_sentence"] == FEEDBACK.corrected_sentence
    assert len(repository.messages) == 2
    assert [message.role for message in repository.messages] == ["user", "tutor"]
    assert repository.messages[1].structured_feedback == FEEDBACK
    assert repository.corrections == [
        CorrectionCreate(
            user_id=USER_ID,
            session_id=SESSION_ID,
            message_id="message-2",
            original_text="Yesterday I go to the store and buy many thing",
            corrected_text=FEEDBACK.corrected_sentence,
            categories=["Past Tense", "Plural Nouns"],
        )
    ]
    assert repository.sessions[SESSION_ID].turn_count == 1
    assert tutor.requests[0].language == "en"
    assert tutor.requests[0].proficiency == "intermediate"
    assert detail.status_code == 200
    assert len(detail.json()["data"]["messages"]) == 2


@pytest.mark.anyio
async def test_session_list_and_end_route_prevent_new_analyze_turns() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        created = await client.post("/api/v1/sessions", json={"language": "es", "proficiency": "beginner"})
        session_id = created.json()["data"]["id"]
        listed = await client.get("/api/v1/sessions?limit=10&offset=0")
        ended = await client.patch(f"/api/v1/sessions/{session_id}/end")
        analyzed = await client.post("/api/v1/tutor/analyze", json={"session_id": session_id, "transcript": "Hola"})

    assert listed.status_code == 200
    assert listed.json()["data"]["items"][0]["id"] == SESSION_ID
    assert ended.status_code == 200
    assert ended.json()["data"]["ended_at"] is not None
    assert analyzed.status_code == 404
