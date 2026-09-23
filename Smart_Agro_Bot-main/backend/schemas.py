from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class HistoryTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(default="", max_length=2000)


class ChatResponse(BaseModel):
    user_message: str
    reply: str
    verified: bool
    sources: List[str] = Field(default_factory=list)
    image_quality_issue: Optional[str] = None

    # ---- Trust indicators ----
    confidence: Literal["high", "medium", "low", "none"] = "none"
    confidence_label: Optional[str] = None
    confidence_reason: Optional[str] = None
    best_match_score: Optional[float] = None
    matched_chunks: int = 0
    matched_crops: List[str] = Field(default_factory=list)
    uncertainty_reasons: List[str] = Field(default_factory=list)


class TranscribeResponse(BaseModel):
    text: Optional[str]
    low_confidence: bool
    language: Optional[str] = None
    debug: Optional[str] = None


class TTSRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2500)


class HealthResponse(BaseModel):
    status: str
    ffmpeg_available: bool