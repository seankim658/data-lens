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
    file_path: str
    row_count: int
    supported_charts: List[Dict[str, Any]] = []
    chat_history: List[ChatMessage] = []
    analysis_log: List[AnalysisRecord] = []

    current_step: Optional[str] = None
    selected_chart_type: Optional[str] = None
    column_mapping: Optional[Dict[str, Optional[str]]] = None
    active_lens_id: Optional[str] = None


class ChartDataPayload(BaseModel):
    session_id: str
    chart_type: str
    mapping: Dict[str, Optional[str]]
    sampling_method: Optional[str] = None
    aggregation_method: Optional[str] = None


class SessionStateUpdatePayload(BaseModel):
    session_id: str
    current_step: Optional[str] = None
    selected_chart_type: Optional[str] = None
    column_mapping: Optional[Dict[str, Optional[str]]] = None
    active_lens_id: Optional[str] = None
