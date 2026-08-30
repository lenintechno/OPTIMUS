from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Public liveness endpoint for local and production health checks."""
    return {"status": "ok", "version": get_settings().version}
