from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class InteractionPayload(BaseModel):
    """Defines the structure of the JSON payload sent from the frontend."""

    session_id: str = Field(
        ..., description="The unique session ID returned by the /upload endpoint."
    )

    tool: str = Field(
        ..., description="The unique ID of the lens being used, e.g., 'axis_lens'."
    )

    details: Dict[str, Any] = Field(
        ...,
        description="The specific data for the interaction, e.g., {'original_range': [0, 100], 'new_range': [50, 100]}.",
    )

    user_hypothesis: Optional[str] = Field(
        None, description="The user's hypothesis about the change."
    )

    before_image_base64: str = Field(
        ..., description="A base64 encoded PNG of the chart before the interaction."
    )

    after_image_base64: str = Field(
        ..., description="A base64 encoded PNG of the chart after the interaction."
    )
