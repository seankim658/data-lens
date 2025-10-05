from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ChatPayload(BaseModel):
    """Defines the structure for a chat request from the frontend."""

    session_id: str = Field(..., description="The unique session ID.")
    message: str = Field(..., description="The user's chat message.")
    step_context: Optional[str] = Field(
        None, description="The current step in the UI workflow."
    )
    sampling_configs: Optional[List[Dict[str, Any]]] = Field(
        None, description="List of available sampling configurations."
    )
    aggregation_configs: Optional[List[Dict[str, Any]]] = Field(
        None, description="List of available aggregation configurations."
    )
