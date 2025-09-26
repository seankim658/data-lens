from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class InteractionPayload(BaseModel):
    """Defines the structure of the JSON payload for the analyze endpoint."""

    session_id: str = Field(..., description="The unique session ID.")
    tool: str = Field(..., description="The unique ID of the lens being used.")
    details: Dict[str, Any] = Field(
        ..., description="Specific data for the interaction."
    )
    user_hypothesis: Optional[str] = Field(None, description="The user's hypothesis.")
    before_image_base64: str = Field(..., description="Base64 PNG of the chart before.")
    after_image_base64: str = Field(..., description="Base64 PNG of the chart after.")
