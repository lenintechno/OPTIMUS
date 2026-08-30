from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.core.config import get_settings
from app.core.security import AuthenticatedUser, get_current_user
from app.db.supabase import SupabaseDatabaseError, SupabaseRestClient
from app.models.schemas import Profile, ProfileUpdate
from app.services.profile import ProfileService, SupabaseProfileRepository

router = APIRouter(prefix="/api/v1/profile", tags=["profile"])


async def get_profile_service() -> ProfileService:
    return ProfileService(SupabaseProfileRepository(SupabaseRestClient(get_settings())))


@router.get("")
async def read_profile(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    service: Annotated[ProfileService, Depends(get_profile_service)],
) -> dict[str, object]:
    try:
        profile = await service.get_profile(user.id, user.access_token)
    except SupabaseDatabaseError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Profile service is unavailable.") from error
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile has not been set up yet.")
    return {"success": True, "data": profile.model_dump(mode="json"), "error": None}


@router.patch("")
async def update_profile(
    changes: ProfileUpdate,
    response: Response,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    service: Annotated[ProfileService, Depends(get_profile_service)],
) -> dict[str, object]:
    try:
        profile, created = await service.update_profile(user.id, user.access_token, changes)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
    except SupabaseDatabaseError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Profile service is unavailable.") from error
    response.status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
    return {"success": True, "data": profile.model_dump(mode="json"), "error": None}
