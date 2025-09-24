from typing import List
from pydantic import BaseModel


class ColumnInfo(BaseModel):
    """Describes a single column in the dataset."""

    name: str
    dtype: str


class SessionData(BaseModel):
    """Defines the structure of the data stored for each session."""

    summary: str
    columns: List[ColumnInfo]
