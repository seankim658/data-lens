from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class InteractionPayload(BaseModel):
    """Defines the structure of the JSON payload sent from the frontend."""

    session_id: str = Field(
        ..., description="The unique session ID returned by the /upload endpoint."
    )

    tool: str = Field(..., description="The unique ID of the lens being used.")

    details: Dict[str, Any] = Field(
        ...,
        description="The specific data for the interaction.",
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


class LensControl(BaseModel):
    """Defines a UI control for a lens."""

    type: str = Field(..., description="The type of UI control.")
    target: str = Field(
        ..., description="The target state key the control manipulates."
    )
    label: str = Field(..., description="The user-facing label for the control.")


class LensConfig(BaseModel):
    """Defines the schema for a lens configuration file."""

    id: str = Field(
        ..., description="The unique identifier for the lens, matching the filename."
    )
    name: str = Field(..., description="The user-facing name of the lens.")
    description: str = Field(
        ..., description="A brief description of what the lens does."
    )
    controls: List[LensControl] = Field(
        ..., description="A list of UI controls for the lens."
    )
    lens_specific_prompt: str = Field(
        ..., description="The prompt template unique to this lens."
    )
