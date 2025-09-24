from typing import List, Dict, Any, Literal, Optional
from pydantic import BaseModel, Field


class ChartContext(BaseModel):
    """Describes the user's current chart configuration."""

    type: str
    active_columns: List[str] = Field(
        default_factory=list,
        description="Names of columns currently in use in the chart",
    )


class DatasetContext(BaseModel):
    """Describes the characteristics of the uploaded dataset."""

    columns: List[Dict[str, Any]]
    column_counts_by_dtype: Dict[str, int]


class EvaluationContext(BaseModel):
    """The full context object sent from the frontend for rule evaluation."""

    chart: ChartContext
    dataset: DatasetContext


class LensControl(BaseModel):
    """Defines a UI control for a lens."""

    type: str
    target: str
    label: str


class CompatibilityRule(BaseModel):
    """Defines a single compatibility rule for a lens."""

    fact: str = Field(..., description="The context fact to check")
    operator: Literal[
        "equal_to",
        "not_equal_to",
        "in",
        "not_in",
        "greater_than",
        "less_than",
        "greater_than_or_equal_to",
        "less_than_or_equal_to",
        "count_where",
        "filter_where",
    ]
    value: Any = Field(
        None, description="The primary value to compare against for simple operators"
    )
    params: Dict[str, Any] = Field(
        {}, description="Parameters for complex operators like 'count_where'"
    )
    expected: Optional["CompatibilityRule"] = Field(
        None, description="A nested rule to evaluate the result of a complex operator"
    )


class LensConfig(BaseModel):
    """Defines the schema for a lens configuration file."""

    id: str
    name: str
    description: str
    compatibility: List[CompatibilityRule] = Field(
        ..., description="A list of rules that must all pass for the lens to be active"
    )
    controls: List[LensControl]
    lens_prompt: str
