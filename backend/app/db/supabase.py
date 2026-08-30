import logging
from collections.abc import Mapping
from typing import Any

import httpx

from app.core.config import Settings

logger = logging.getLogger(__name__)


class SupabaseDatabaseError(Exception):
    """Safe wrapper for a Supabase REST failure."""


class SupabaseRestClient:
    """Small REST client that always queries Supabase with the caller's JWT.

    This deliberately uses the public anon key plus the authenticated user's
    token, so Postgres RLS remains the enforcement point for user data.
    """

    def __init__(self, settings: Settings) -> None:
        self._url = settings.supabase_url.rstrip("/") if settings.supabase_url else None
        self._anon_key = settings.supabase_anon_key

    def _headers(self, access_token: str, extra: Mapping[str, str] | None = None) -> dict[str, str]:
        if not self._url or not self._anon_key:
            raise SupabaseDatabaseError("Supabase database is not configured.")
        headers = {"apikey": self._anon_key, "Authorization": f"Bearer {access_token}"}
        if extra:
            headers.update(extra)
        return headers

    async def request(
        self,
        method: str,
        path: str,
        access_token: str,
        *,
        params: Mapping[str, str] | None = None,
        json: Mapping[str, Any] | None = None,
        headers: Mapping[str, str] | None = None,
    ) -> list[dict[str, Any]]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.request(
                    method,
                    f"{self._url}/rest/v1/{path}",
                    params=params,
                    json=json,
                    headers=self._headers(access_token, headers),
                )
        except httpx.HTTPError as error:
            logger.error("Supabase HTTP/network error on %s %s: %s", method, path, type(error).__name__)
            raise SupabaseDatabaseError("Supabase database is unavailable.") from error
        if response.status_code >= 400:
            logger.error(
                "Supabase REST error on %s %s: status_code=%d, response_text=%s",
                method,
                path,
                response.status_code,
                response.text,
            )
            raise SupabaseDatabaseError("Supabase database request failed.")
        try:
            payload = response.json()
        except Exception as error:
            logger.error(
                "Supabase JSON decode error on %s %s: status_code=%d, response_text=%s",
                method,
                path,
                response.status_code,
                response.text,
            )
            raise SupabaseDatabaseError("Supabase database returned an invalid response.") from error
        if not isinstance(payload, list) or not all(isinstance(item, dict) for item in payload):
            logger.error(
                "Supabase invalid payload shape on %s %s: status_code=%d, payload=%s",
                method,
                path,
                response.status_code,
                payload,
            )
            raise SupabaseDatabaseError("Supabase database returned an invalid response.")
        return payload
