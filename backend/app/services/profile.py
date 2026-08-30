from typing import Protocol

from app.db.supabase import SupabaseRestClient
from app.models.schemas import Profile, ProfileUpdate


class ProfileRepository(Protocol):
    async def get(self, user_id: str, access_token: str) -> Profile | None: ...

    async def save(self, user_id: str, access_token: str, changes: ProfileUpdate) -> Profile: ...


class SupabaseProfileRepository:
    """Profile persistence backed by Supabase REST under the user's JWT."""

    def __init__(self, client: SupabaseRestClient) -> None:
        self._client = client

    async def get(self, user_id: str, access_token: str) -> Profile | None:
        rows = await self._client.request(
            "GET", "profiles", access_token, params={"id": f"eq.{user_id}", "select": "*"}
        )
        return Profile.model_validate(rows[0]) if rows else None

    async def save(self, user_id: str, access_token: str, changes: ProfileUpdate) -> Profile:
        payload = changes.model_dump(exclude_unset=True)
        payload["id"] = user_id
        rows = await self._client.request(
            "POST",
            "profiles",
            access_token,
            json=payload,
            headers={"Prefer": "resolution=merge-duplicates,return=representation"},
        )
        return Profile.model_validate(rows[0])


class ProfileService:
    def __init__(self, repository: ProfileRepository) -> None:
        self._repository = repository

    async def get_profile(self, user_id: str, access_token: str) -> Profile | None:
        return await self._repository.get(user_id, access_token)

    async def update_profile(self, user_id: str, access_token: str, changes: ProfileUpdate) -> tuple[Profile, bool]:
        current = await self.get_profile(user_id, access_token)
        if current is None and (changes.target_language is None or changes.proficiency is None):
            raise ValueError("Target language and proficiency are required when creating a profile.")
        return await self._repository.save(user_id, access_token, changes), current is None
