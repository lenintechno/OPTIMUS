from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.api.routes.profile import router as profile_router
from app.api.routes.sessions import router as sessions_router
from app.api.routes.tutor import router as tutor_router
from app.core.config import get_settings


def create_app() -> FastAPI:
    """Build the FastAPI application with shared middleware and routes."""
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version=settings.version)
    app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origin_list, allow_credentials=True, allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"], allow_headers=["Authorization", "Content-Type"])
    app.include_router(auth_router)
    app.include_router(profile_router)
    app.include_router(sessions_router)
    app.include_router(tutor_router)
    app.include_router(health_router)
    return app


app = create_app()
