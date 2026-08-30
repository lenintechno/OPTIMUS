"""Optional integration test for the Phase 3 Supabase RLS policies.

It is skipped locally until two real Supabase test-user JWTs are provided.
The test uses only the anon key and user access tokens, exactly as the app does.
"""

import os

import pytest
from httpx import AsyncClient


REQUIRED_ENVIRONMENT = (
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_RLS_TEST_USER_A_JWT",
    "SUPABASE_RLS_TEST_USER_B_JWT",
    "SUPABASE_RLS_TEST_USER_A_ID",
    "SUPABASE_RLS_TEST_USER_B_ID",
)
pytestmark = pytest.mark.skipif(
    any(not os.getenv(name) for name in REQUIRED_ENVIRONMENT),
    reason="Set two Supabase RLS test users and JWTs to run database-isolation verification.",
)


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


def headers(token: str, prefer: str | None = None) -> dict[str, str]:
    result = {"apikey": os.environ["SUPABASE_ANON_KEY"], "Authorization": f"Bearer {token}"}
    if prefer:
        result["Prefer"] = prefer
    return result


@pytest.mark.anyio
async def test_rls_prevents_cross_user_profile_session_message_and_correction_access() -> None:
    base_url = f"{os.environ['SUPABASE_URL'].rstrip('/')}/rest/v1"
    token_a = os.environ["SUPABASE_RLS_TEST_USER_A_JWT"]
    token_b = os.environ["SUPABASE_RLS_TEST_USER_B_JWT"]
    user_a = os.environ["SUPABASE_RLS_TEST_USER_A_ID"]
    user_b = os.environ["SUPABASE_RLS_TEST_USER_B_ID"]

    async with AsyncClient(base_url=base_url, timeout=10.0) as client:
        own_profile = await client.get("/profiles", params={"id": f"eq.{user_a}", "select": "id"}, headers=headers(token_a))
        other_profile = await client.get("/profiles", params={"id": f"eq.{user_b}", "select": "id"}, headers=headers(token_a))
        assert own_profile.status_code == 200 and own_profile.json() == [{"id": user_a}]
        assert other_profile.status_code == 200 and other_profile.json() == []

        created_session = await client.post(
            "/sessions",
            json={"user_id": user_a, "language": "en", "proficiency": "beginner"},
            headers=headers(token_a, "return=representation"),
        )
        assert created_session.status_code == 201
        session = created_session.json()[0]
        try:
            created_message = await client.post(
                "/messages",
                json={"session_id": session["id"], "role": "user", "content": "RLS test message"},
                headers=headers(token_a, "return=representation"),
            )
            assert created_message.status_code == 201
            message = created_message.json()[0]
            created_correction = await client.post(
                "/corrections",
                json={
                    "user_id": user_a,
                    "session_id": session["id"],
                    "message_id": message["id"],
                    "original_text": "RLS test",
                    "corrected_text": "RLS test.",
                    "categories": ["Test"],
                },
                headers=headers(token_a, "return=representation"),
            )
            assert created_correction.status_code == 201

            for table in ("sessions", "messages", "corrections"):
                result = await client.get(f"/{table}", params={"select": "id"}, headers=headers(token_b))
                assert result.status_code == 200
                assert all(row["id"] not in {session["id"], message["id"], created_correction.json()[0]["id"]} for row in result.json())
        finally:
            deleted = await client.delete("/sessions", params={"id": f"eq.{session['id']}"}, headers=headers(token_a, "return=representation"))
            assert deleted.status_code == 200
