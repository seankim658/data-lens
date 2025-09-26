from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class ColumnInfo(BaseModel):
    """Describes a single column in the dataset."""

    name: str
    dtype: str
    description: Optional[Dict[str, Any]]


class SessionData(BaseModel):
    """Defines the structure of the data stored for each session."""

    summary: str
    columns: List[ColumnInfo]
