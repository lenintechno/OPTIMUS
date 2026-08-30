from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

Language = Literal["en", "es", "fr", "de", "hi"]
Proficiency = Literal["beginner", "intermediate", "advanced"]


class Profile(BaseModel):
    """Persisted learner profile returned by the profile API."""

    model_config = ConfigDict(extra="ignore")

    id: str
    display_name: str | None = None
    target_language: Language
    proficiency: Proficiency
    preferred_voice: str | None = None
    created_at: datetime
    updated_at: datetime


class ProfileUpdate(BaseModel):
    """Fields a learner may change in their profile."""

    display_name: str | None = Field(default=None, max_length=80)
    target_language: Language | None = None
    proficiency: Proficiency | None = None
    preferred_voice: str | None = Field(default=None, max_length=255)

    @field_validator("display_name", "preferred_voice", mode="before")
    @classmethod
    def normalize_optional_text(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip() or None
        return value


class GrammarIssue(BaseModel):
    """One grammar issue identified in a learner's utterance."""

    model_config = ConfigDict(extra="forbid")

    type: str = Field(min_length=1, max_length=100)
    original: str = Field(min_length=1, max_length=500)
    correction: str = Field(min_length=1, max_length=500)
    explanation: str = Field(min_length=1, max_length=1_000)


class VocabularySuggestion(BaseModel):
    """A more precise or natural vocabulary option."""

    model_config = ConfigDict(extra="forbid")

    original: str = Field(min_length=1, max_length=500)
    suggestion: str = Field(min_length=1, max_length=500)
    why: str = Field(min_length=1, max_length=1_000)


class TutorFeedback(BaseModel):
    """Strict structured response expected from the Gemini tutor."""

    model_config = ConfigDict(extra="forbid")

    corrected_sentence: str = Field(min_length=1, max_length=1_000)
    grammar_issues: list[GrammarIssue] = Field(default_factory=list, max_length=10)
    explanation: str = Field(min_length=1, max_length=2_000)
    vocabulary_suggestions: list[VocabularySuggestion] = Field(default_factory=list, max_length=10)
    natural_alternative: str = Field(min_length=1, max_length=1_000)
    encouragement: str = Field(min_length=1, max_length=500)
    follow_up_question: str = Field(min_length=1, max_length=1_000)
    mistake_categories: list[str] = Field(min_length=1, max_length=3)

    @field_validator("mistake_categories")
    @classmethod
    def validate_categories(cls, categories: list[str]) -> list[str]:
        normalized = [category.strip() for category in categories]
        if any(not category for category in normalized):
            raise ValueError("Mistake categories must not be blank.")
        if len(set(category.casefold() for category in normalized)) != len(normalized):
            raise ValueError("Mistake categories must be unique.")
        return normalized


class ConversationTurn(BaseModel):
    """Minimal recent-turn context for the future tutor session flow."""

    model_config = ConfigDict(extra="forbid")

    role: Literal["user", "tutor"]
    content: str = Field(min_length=1, max_length=2_000)


class TutorAnalysisInput(BaseModel):
    """Validated service input; the HTTP endpoint is introduced in Phase 5."""

    transcript: str = Field(min_length=1, max_length=500)
    language: Language
    proficiency: Proficiency
    recurring_categories: list[str] = Field(default_factory=list, max_length=3)
    # The service retains only the latest eight turns when constructing the
    # Gemini prompt, allowing callers to hand it a longer persisted history.
    conversation_turns: list[ConversationTurn] = Field(default_factory=list, max_length=100)

    @field_validator("transcript")
    @classmethod
    def normalize_transcript(cls, transcript: str) -> str:
        normalized = transcript.strip()
        if not normalized:
            raise ValueError("Transcript must not be blank.")
        return normalized


class SessionCreate(BaseModel):
    """Input for a new text-practice session."""

    language: Language
    proficiency: Proficiency


class PracticeSession(BaseModel):
    """Persisted practice-session metadata."""

    model_config = ConfigDict(extra="ignore")

    id: str
    user_id: str
    language: Language
    proficiency: Proficiency
    started_at: datetime
    ended_at: datetime | None = None
    turn_count: int = Field(ge=0)
    summary: str | None = None


class PracticeMessage(BaseModel):
    """One persisted learner or tutor turn."""

    model_config = ConfigDict(extra="ignore")

    id: str
    session_id: str
    role: Literal["user", "tutor"]
    content: str
    structured_feedback: TutorFeedback | None = None
    created_at: datetime


class SessionDetail(BaseModel):
    """Session metadata with its chronological message history."""

    session: PracticeSession
    messages: list[PracticeMessage]


class SessionPage(BaseModel):
    """Offset-paginated session collection."""

    items: list[PracticeSession]
    limit: int = Field(ge=1, le=100)
    offset: int = Field(ge=0)


class TutorAnalyzeRequest(BaseModel):
    """HTTP contract for a persisted text tutor turn."""

    session_id: UUID
    transcript: str = Field(min_length=1, max_length=500)

    @field_validator("transcript")
    @classmethod
    def normalize_transcript(cls, transcript: str) -> str:
        normalized = transcript.strip()
        if not normalized:
            raise ValueError("Transcript must not be blank.")
        return normalized


class CorrectionCreate(BaseModel):
    """The correction record persisted for each successful tutor response."""

    user_id: str
    session_id: str
    message_id: str
    original_text: str
    corrected_text: str
    categories: list[str]


class GrammarCategoryCount(BaseModel):
    """Aggregated count of a specific grammar mistake category."""

    category: str
    count: int = Field(ge=0)


class RecentSessionItem(BaseModel):
    """Summary of a past session for activity history."""

    model_config = ConfigDict(extra="ignore")

    id: str
    language: Language
    proficiency: Proficiency
    started_at: datetime
    ended_at: datetime | None = None
    turn_count: int = Field(ge=0)
    duration_seconds: int | None = None


class ProgressSummary(BaseModel):
    """Aggregated learning progress metrics computed from persisted user data."""

    total_sessions: int = Field(ge=0)
    total_sentences: int = Field(ge=0)
    total_corrections: int = Field(ge=0)
    current_level: Proficiency
    target_language: Language
    streak_days: int = Field(ge=0)
    common_mistakes: list[GrammarCategoryCount] = Field(default_factory=list)
    recent_sessions: list[RecentSessionItem] = Field(default_factory=list)


JsonObject = dict[str, Any]

