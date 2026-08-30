"""Gemini-backed structured language feedback for Phase 4."""

from collections.abc import Sequence
from typing import Protocol

from pydantic import ValidationError

from app.core.config import Settings
from app.models.schemas import ConversationTurn, TutorAnalysisInput, TutorFeedback


class TutorServiceUnavailableError(Exception):
    """The LLM could not respond; callers should preserve the learner input."""

    user_message = "The tutor needs a moment. Please try again shortly."


class GeminiClient(Protocol):
    """Boundary around the SDK so tutor logic remains deterministic in tests."""

    async def generate(self, *, system_instruction: str, user_message: str) -> str: ...


class GoogleGenerativeAIClient:
    """Official google-generativeai SDK adapter using Gemini JSON mode."""

    def __init__(self, settings: Settings) -> None:
        if not settings.gemini_api_key:
            raise TutorServiceUnavailableError("Gemini is not configured.")
        self._api_key = settings.gemini_api_key
        self._model_name = settings.gemini_model
        self._temperature = settings.gemini_temperature
        self._timeout_seconds = settings.gemini_timeout_seconds

    async def generate(self, *, system_instruction: str, user_message: str) -> str:
        try:
            import google.generativeai as genai
        except ImportError as error:
            raise TutorServiceUnavailableError("Gemini SDK is unavailable.") from error

        try:
            genai.configure(api_key=self._api_key)
            model = genai.GenerativeModel(model_name=self._model_name, system_instruction=system_instruction)
            response = await model.generate_content_async(
                user_message,
                generation_config=genai.GenerationConfig(
                    temperature=self._temperature,
                    response_mime_type="application/json",
                    response_schema=gemini_feedback_schema(),
                ),
                request_options={"timeout": self._timeout_seconds},
            )
            return response.text
        except Exception as error:
            # The SDK exposes transport, rate-limit, and safety failures through
            # several provider-specific exception classes. Do not leak them.
            raise TutorServiceUnavailableError() from error


class TutorService:
    """Builds prompts, validates Gemini JSON, retries once, then falls back."""

    def __init__(self, client: GeminiClient) -> None:
        self._client = client

    async def analyze(self, request: TutorAnalysisInput) -> TutorFeedback:
        system_instruction = build_system_instruction(request)
        initial_message = build_user_message(request)
        try:
            raw_response = await self._client.generate(
                system_instruction=system_instruction,
                user_message=initial_message,
            )
        except TutorServiceUnavailableError:
            raise

        feedback = parse_feedback(raw_response)
        if feedback is not None:
            return feedback

        retry_message = build_user_message(
            request,
            retry_instruction="Your previous response did not match the required schema. Return valid JSON only.",
        )
        try:
            retry_response = await self._client.generate(
                system_instruction=system_instruction,
                user_message=retry_message,
            )
        except TutorServiceUnavailableError:
            raise
        return parse_feedback(retry_response) or fallback_feedback(request.transcript)


def build_system_instruction(request: TutorAnalysisInput) -> str:
    categories = ", ".join(category.strip() for category in request.recurring_categories[:3] if category.strip()) or "none yet"
    return f"""You are OPTIMUS, a warm, patient, expert language tutor.
Target language: {request.language}
Learner proficiency: {request.proficiency}
Recurring focus areas (if any): {categories}

On every learner utterance you must:
- Understand the intended meaning.
- Produce a natural corrected version of the sentence.
- Explain the main issues at a level appropriate for the learner.
- Suggest better vocabulary or more natural phrasing when helpful.
- Give one short, genuine encouragement.
- Ask one natural follow-up question that continues the conversation or gently practices a weak area.

Stay in the tutor role. Refuse harmful requests politely while still returning the required schema.
Respond ONLY with valid JSON that matches the required schema. Do not add markdown, commentary, or any text outside the JSON object."""


def gemini_feedback_schema() -> dict[str, object]:
    """Return the OpenAPI-schema subset accepted by google-generativeai.

    Pydantic remains the authoritative validator. This intentionally omits
    local string-length constraints because the legacy SDK's Schema protobuf
    does not support `minLength` or `maxLength`.
    """

    grammar_issue = {
        "type": "object",
        "properties": {
            "type": {"type": "string"},
            "original": {"type": "string"},
            "correction": {"type": "string"},
            "explanation": {"type": "string"},
        },
        "required": ["type", "original", "correction", "explanation"],
    }
    vocabulary_suggestion = {
        "type": "object",
        "properties": {
            "original": {"type": "string"},
            "suggestion": {"type": "string"},
            "why": {"type": "string"},
        },
        "required": ["original", "suggestion", "why"],
    }
    return {
        "type": "object",
        "properties": {
            "corrected_sentence": {"type": "string"},
            "grammar_issues": {"type": "array", "items": grammar_issue},
            "explanation": {"type": "string"},
            "vocabulary_suggestions": {"type": "array", "items": vocabulary_suggestion},
            "natural_alternative": {"type": "string"},
            "encouragement": {"type": "string"},
            "follow_up_question": {"type": "string"},
            "mistake_categories": {"type": "array", "items": {"type": "string"}},
        },
        "required": [
            "corrected_sentence",
            "grammar_issues",
            "explanation",
            "vocabulary_suggestions",
            "natural_alternative",
            "encouragement",
            "follow_up_question",
            "mistake_categories",
        ],
    }


def build_user_message(request: TutorAnalysisInput, retry_instruction: str | None = None) -> str:
    history = format_history(request.conversation_turns)
    parts = []
    if history:
        parts.append(f"Recent conversation context:\n{history}")
    parts.append(f"Learner's original transcript:\n{request.transcript}")
    if retry_instruction:
        parts.append(retry_instruction)
    return "\n\n".join(parts)


def format_history(turns: Sequence[ConversationTurn]) -> str:
    return "\n".join(f"{turn.role.title()}: {turn.content}" for turn in turns[-8:])


def parse_feedback(raw_response: str) -> TutorFeedback | None:
    try:
        return TutorFeedback.model_validate_json(raw_response)
    except (ValidationError, ValueError, TypeError):
        return None


def fallback_feedback(transcript: str) -> TutorFeedback:
    """Safe continuation when Gemini twice returns malformed structured output."""

    corrected = transcript.strip()
    if corrected and corrected[-1] not in ".!?":
        corrected = f"{corrected}."
    return TutorFeedback(
        corrected_sentence=corrected or "Please try your sentence again.",
        grammar_issues=[],
        explanation="I could not prepare detailed feedback this time, but your sentence is saved for another try.",
        vocabulary_suggestions=[],
        natural_alternative=corrected or "Please try your sentence again.",
        encouragement="Keep going—every sentence is useful practice.",
        follow_up_question="Could you say that sentence once more?",
        mistake_categories=["General Practice"],
    )
