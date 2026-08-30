from typing import Annotated

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.core.config import get_settings

bearer_scheme = HTTPBearer(auto_error=False)


class AuthenticatedUser(BaseModel):
    id: str
    email: str | None = None
    access_token: str


async def get_current_user(credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)]) -> AuthenticatedUser:
    """Validate a Supabase-issued access token and return its user identity."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication is required.", headers={"WWW-Authenticate": "Bearer"})
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Authentication service is not configured.")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.supabase_url.rstrip('/')}/auth/v1/user", headers={"apikey": settings.supabase_anon_key, "Authorization": f"Bearer {credentials.credentials}"})
    except httpx.HTTPError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Authentication service is unavailable.") from error
    if response.status_code != status.HTTP_200_OK:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired authentication token.", headers={"WWW-Authenticate": "Bearer"})
    payload = response.json()
    if not isinstance(payload.get("id"), str):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token.", headers={"WWW-Authenticate": "Bearer"})
    return AuthenticatedUser(id=payload["id"], email=payload.get("email"), access_token=credentials.credentials)
