from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.routes.sessions import get_session_service
from app.core.config import get_settings
from app.core.security import AuthenticatedUser, get_current_user
from app.db.supabase import SupabaseDatabaseError
from app.models.schemas import TutorAnalyzeRequest
from app.services.llm import GoogleGenerativeAIClient, TutorService, TutorServiceUnavailableError
from app.services.session import SessionService

router = APIRouter(prefix="/api/v1/tutor", tags=["tutor"])


async def get_tutor_service() -> TutorService:
    return TutorService(GoogleGenerativeAIClient(get_settings()))


@router.post("/analyze")
async def analyze_transcript(
    request: TutorAnalyzeRequest,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    sessions: Annotated[SessionService, Depends(get_session_service)],
    tutor: Annotated[TutorService, Depends(get_tutor_service)],
) -> dict[str, object]:
    try:
        feedback = await sessions.analyze_text(
            user_id=user.id,
            access_token=user.access_token,
            session_id=str(request.session_id),
            transcript=request.transcript,
            tutor=tutor,
        )
    except TutorServiceUnavailableError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=error.user_message) from error
    except SupabaseDatabaseError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Session service is unavailable.") from error
    if feedback is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found or already ended.")
    return {"success": True, "data": feedback.model_dump(mode="json"), "error": None}
