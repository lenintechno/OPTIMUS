from datetime import UTC, datetime

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.routes.profile import get_profile_service
from app.core.security import AuthenticatedUser, get_current_user
from app.main import app
from app.models.schemas import Profile, ProfileUpdate

USER_ID = "11111111-1111-4111-8111-111111111111"


class InMemoryProfileRepository:
    def __init__(self) -> None:
        self.profiles: dict[str, Profile] = {}

    async def get(self, user_id: str, access_token: str) -> Profile | None:
        assert access_token == "test-token"
        return self.profiles.get(user_id)

    async def save(self, user_id: str, access_token: str, changes: ProfileUpdate) -> Profile:
        current = self.profiles.get(user_id)
        values = changes.model_dump(exclude_unset=True)
        now = datetime.now(UTC)
        profile = Profile(
            id=user_id,
            display_name=values.get("display_name", current.display_name if current else None),
            target_language=values.get("target_language", current.target_language if current else None),
            proficiency=values.get("proficiency", current.proficiency if current else None),
            preferred_voice=values.get("preferred_voice", current.preferred_voice if current else None),
            created_at=current.created_at if current else now,
            updated_at=now,
        )
        self.profiles[user_id] = profile
        return profile


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture
def profile_repository() -> InMemoryProfileRepository:
    return InMemoryProfileRepository()


@pytest.fixture(autouse=True)
def override_dependencies(profile_repository: InMemoryProfileRepository):
    from app.services.profile import ProfileService

    async def current_user() -> AuthenticatedUser:
        return AuthenticatedUser(id=USER_ID, email="learner@example.com", access_token="test-token")

    app.dependency_overrides[get_current_user] = current_user
    async def profile_service() -> ProfileService:
        return ProfileService(profile_repository)

    app.dependency_overrides[get_profile_service] = profile_service
    yield
    app.dependency_overrides.clear()


@pytest.mark.anyio
async def test_profile_requires_language_and_proficiency_on_initial_creation() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.patch("/api/v1/profile", json={"display_name": "Ari"})

    assert response.status_code == 400
    assert response.json()["detail"] == "Target language and proficiency are required when creating a profile."


@pytest.mark.anyio
async def test_profile_is_created_then_read_and_updated(profile_repository: InMemoryProfileRepository) -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        created = await client.patch("/api/v1/profile", json={"display_name": " Ari ", "target_language": "es", "proficiency": "beginner"})
        fetched = await client.get("/api/v1/profile")
        updated = await client.patch("/api/v1/profile", json={"proficiency": "intermediate", "preferred_voice": "Google español"})

    assert created.status_code == 201
    assert created.json()["data"]["display_name"] == "Ari"
    assert fetched.status_code == 200
    assert fetched.json()["data"]["target_language"] == "es"
    assert updated.status_code == 200
    assert updated.json()["data"]["proficiency"] == "intermediate"
    assert profile_repository.profiles[USER_ID].preferred_voice == "Google español"


@pytest.mark.anyio
async def test_profile_rejects_unsupported_language() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.patch("/api/v1/profile", json={"target_language": "it", "proficiency": "beginner"})

    assert response.status_code == 422
