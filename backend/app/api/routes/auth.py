from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.security import AuthenticatedUser, get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])


@router.get("/me")
async def read_current_user(user: Annotated[AuthenticatedUser, Depends(get_current_user)]) -> dict[str, object]:
    """Protected authentication smoke-test endpoint."""
    return {"success": True, "data": {"id": user.id, "email": user.email}, "error": None}
