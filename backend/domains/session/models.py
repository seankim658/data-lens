from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel


class ColumnInfo(BaseModel):
    """Describes a single column in the dataset."""

    name: str
    dtype: str
    description: Optional[Dict[str, Any]]


class ChatMessage(BaseModel):
    """A single message in the chat history."""

    role: Literal["user", "assistant"]
    content: str


class AnalysisRecord(BaseModel):
    """Record of a single lens analysis interaction."""

    lens_id: str
    lens_name: str
    user_hypothesis: str
    ai_summary: str
    correctness: Literal["correct", "partially_correct", "incorrect"]


class SessionData(BaseModel):
    """Defines the structure of the data stored for each session."""

    summary: str
    columns: List[ColumnInfo]
    chart_data: List[Dict[str, Any]] = []
    supported_charts: List[Dict[str, Any]] = []
    chat_history: List[ChatMessage] = []
    analysis_log: List[AnalysisRecord] = []
