from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from app.core.config import get_settings
from app.core.security import AuthenticatedUser, get_current_user
from app.db.supabase import SupabaseDatabaseError, SupabaseRestClient
from app.models.schemas import SessionCreate
from app.services.profile import ProfileService, SupabaseProfileRepository
from app.services.session import SessionService, SupabaseSessionRepository

router = APIRouter(prefix="/api/v1/sessions", tags=["sessions"])



async def get_session_service() -> SessionService:
    return SessionService(SupabaseSessionRepository(SupabaseRestClient(get_settings())))


async def get_profile_service() -> ProfileService:
    return ProfileService(SupabaseProfileRepository(SupabaseRestClient(get_settings())))


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_session(
    session: SessionCreate,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    service: Annotated[SessionService, Depends(get_session_service)],
) -> dict[str, object]:
    try:
        created = await service.create_session(user.id, user.access_token, session)
    except SupabaseDatabaseError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Session service is unavailable.") from error
    return {"success": True, "data": created.model_dump(mode="json"), "error": None}


@router.get("")
async def list_sessions(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    service: Annotated[SessionService, Depends(get_session_service)],
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> dict[str, object]:
    try:
        page = await service.list_sessions(user.access_token, limit, offset)
    except SupabaseDatabaseError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Session service is unavailable.") from error
    return {"success": True, "data": page.model_dump(mode="json"), "error": None}


@router.get("/progress")
async def get_progress(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    service: Annotated[SessionService, Depends(get_session_service)],
    profile_service: Annotated[ProfileService, Depends(get_profile_service)],
) -> dict[str, object]:
    try:
        profile = await profile_service.get_profile(user.id, user.access_token)
        progress = await service.get_progress(user.id, user.access_token, profile=profile)
    except SupabaseDatabaseError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Session service is unavailable.") from error
    return {"success": True, "data": progress.model_dump(mode="json"), "error": None}


@router.get("/{session_id}")
async def read_session(
    session_id: str,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    service: Annotated[SessionService, Depends(get_session_service)],
) -> dict[str, object]:

    try:
        detail = await service.get_session_detail(user.access_token, session_id)
    except SupabaseDatabaseError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Session service is unavailable.") from error
    if detail is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")
    return {"success": True, "data": detail.model_dump(mode="json"), "error": None}


@router.patch("/{session_id}/end")
async def end_session(
    session_id: str,
    response: Response,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    service: Annotated[SessionService, Depends(get_session_service)],
) -> dict[str, object]:
    try:
        ended = await service.end_session(user.access_token, session_id)
    except SupabaseDatabaseError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Session service is unavailable.") from error
    if ended is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")
    response.status_code = status.HTTP_200_OK
    return {"success": True, "data": ended.model_dump(mode="json"), "error": None}
