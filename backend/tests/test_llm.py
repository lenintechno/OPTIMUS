import json
import warnings

import pytest
from pydantic import ValidationError

from app.models.schemas import ConversationTurn, TutorAnalysisInput, TutorFeedback
from app.services.llm import (
    TutorService,
    TutorServiceUnavailableError,
    build_system_instruction,
    build_user_message,
    fallback_feedback,
    gemini_feedback_schema,
)


VALID_FEEDBACK = {
    "corrected_sentence": "Yesterday I went to the store and bought many things.",
    "grammar_issues": [
        {
            "type": "Past tense",
            "original": "go",
            "correction": "went",
            "explanation": "Use the past tense for a completed action yesterday.",
        }
    ],
    "explanation": "Use past-tense verbs when describing a completed action.",
    "vocabulary_suggestions": [
        {"original": "many thing", "suggestion": "many things", "why": "Use the plural noun after many."}
    ],
    "natural_alternative": "I went shopping yesterday and bought several things.",
    "encouragement": "Nice job describing a complete idea.",
    "follow_up_question": "What did you buy at the store?",
    "mistake_categories": ["Past Tense", "Plural Nouns"],
}


class FakeGeminiClient:
    def __init__(self, responses: list[str]) -> None:
        self.responses = responses
        self.calls: list[dict[str, str]] = []

    async def generate(self, *, system_instruction: str, user_message: str) -> str:
        self.calls.append({"system_instruction": system_instruction, "user_message": user_message})
        return self.responses.pop(0)


class UnavailableGeminiClient:
    async def generate(self, *, system_instruction: str, user_message: str) -> str:
        raise TutorServiceUnavailableError()


def analysis_input(**overrides: object) -> TutorAnalysisInput:
    values: dict[str, object] = {
        "transcript": "Yesterday I go to the store and buy many thing",
        "language": "en",
        "proficiency": "intermediate",
        "recurring_categories": ["Past Tense", "Articles"],
    }
    values.update(overrides)
    return TutorAnalysisInput.model_validate(values)


def test_tutor_feedback_schema_accepts_the_required_structure() -> None:
    feedback = TutorFeedback.model_validate(VALID_FEEDBACK)

    assert feedback.corrected_sentence == "Yesterday I went to the store and bought many things."
    assert feedback.mistake_categories == ["Past Tense", "Plural Nouns"]


def test_tutor_feedback_schema_rejects_missing_required_fields_and_invalid_categories() -> None:
    missing = VALID_FEEDBACK.copy()
    del missing["follow_up_question"]
    invalid_categories = VALID_FEEDBACK | {"mistake_categories": ["Past Tense", "past tense"]}

    with pytest.raises(ValidationError):
        TutorFeedback.model_validate(missing)
    with pytest.raises(ValidationError):
        TutorFeedback.model_validate(invalid_categories)


@pytest.mark.anyio
async def test_service_returns_valid_native_json_response_without_retry() -> None:
    client = FakeGeminiClient([json.dumps(VALID_FEEDBACK)])
    service = TutorService(client)

    feedback = await service.analyze(analysis_input())

    assert feedback.corrected_sentence == VALID_FEEDBACK["corrected_sentence"]
    assert len(client.calls) == 1
    assert "Target language: en" in client.calls[0]["system_instruction"]
    assert "Learner's original transcript:" in client.calls[0]["user_message"]


@pytest.mark.anyio
async def test_service_retries_once_after_malformed_json_then_returns_valid_feedback() -> None:
    client = FakeGeminiClient(["not JSON", json.dumps(VALID_FEEDBACK)])
    service = TutorService(client)

    feedback = await service.analyze(analysis_input())

    assert feedback.follow_up_question == VALID_FEEDBACK["follow_up_question"]
    assert len(client.calls) == 2
    assert "Return valid JSON only." in client.calls[1]["user_message"]


@pytest.mark.anyio
async def test_service_returns_safe_fallback_after_two_malformed_responses() -> None:
    client = FakeGeminiClient(["{}", "still not JSON"])
    service = TutorService(client)

    feedback = await service.analyze(analysis_input())

    assert feedback.corrected_sentence == "Yesterday I go to the store and buy many thing."
    assert feedback.mistake_categories == ["General Practice"]
    assert len(client.calls) == 2


@pytest.mark.anyio
async def test_service_preserves_unavailable_error_for_timeout_or_rate_limit_handling() -> None:
    with pytest.raises(TutorServiceUnavailableError) as error:
        await TutorService(UnavailableGeminiClient()).analyze(analysis_input())

    assert error.value.user_message == "The tutor needs a moment. Please try again shortly."


def test_prompt_includes_only_the_last_eight_turns_and_recurring_focus_areas() -> None:
    turns = [ConversationTurn(role="user" if index % 2 == 0 else "tutor", content=f"turn {index}") for index in range(10)]
    request = analysis_input(conversation_turns=turns)

    system_instruction = build_system_instruction(request)
    user_message = build_user_message(request)

    assert "Recurring focus areas (if any): Past Tense, Articles" in system_instruction
    assert "turn 0" not in user_message
    assert "turn 1" not in user_message
    assert "turn 2" in user_message
    assert "turn 9" in user_message


def test_fallback_preserves_the_transcript_as_a_safe_corrected_sentence() -> None:
    feedback = fallback_feedback("I has went home")

    assert feedback.corrected_sentence == "I has went home."


def test_native_gemini_schema_is_compatible_with_the_configured_sdk() -> None:
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", FutureWarning)
        import google.generativeai as genai

    model = genai.GenerativeModel("gemini-1.5-flash")
    request = model._prepare_request(
        contents="Test",
        generation_config=genai.GenerationConfig(
            temperature=0.5,
            response_mime_type="application/json",
            response_schema=gemini_feedback_schema(),
        ),
        tools=None,
        tool_config=None,
    )

    assert request.generation_config.response_mime_type == "application/json"
    assert "corrected_sentence" in request.generation_config.response_schema.properties
