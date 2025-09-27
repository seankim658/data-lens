import logging
import uuid
import json
import polars as pl
from io import BytesIO
from typing import Any, Dict, List, Tuple

from domains.session.models import SessionData, ColumnInfo
from session_store.base import SessionStore
from session_store.memory_store import InMemorySessionStore
from session_store.redis_store import RedisSessionStore
from core.config import settings


def initialize_session_store() -> SessionStore:
    """Initialize the session store."""
    store_type = settings.SESSION_STORE_TYPE.lower().strip()
    match store_type:
        case "redis":
            return RedisSessionStore()
        case "memory":
            return InMemorySessionStore()
        case _:
            return InMemorySessionStore()


def _format_dataset_summary(
    description: str, row_count: int, columns: List[ColumnInfo]
) -> str:
    """Formats the dataset summary."""
    col_count = len(columns)
    schema_str = "\n".join([f"- '{c.name}' ({c.dtype})" for c in columns])

    summary = (
        f"User-provided description: {description}\n\n"
        f"The dataset has {row_count} rows and {col_count} columns.\n\n"
        f"Columns and their data types:\n{schema_str}"
    )
    return summary


def _create_column_descriptions(describe_df: pl.DataFrame) -> Dict[str, Dict[str, Any]]:
    """Transforms the polars describe dataframe to a dictionary."""
    descriptions = {}
    stat_names = describe_df.get_column("statistic").to_list()

    for col_name in describe_df.columns[1:]:
        stat_values = describe_df.get_column(col_name).to_list()

        col_description = {}
        for stat_name, value in zip(stat_names, stat_values):
            if value is not None:
                if isinstance(value, float):
                    col_description[stat_name] = f"{value:.2f}"
                else:
                    col_description[stat_name] = value
        descriptions[col_name] = col_description

    return descriptions


def create_and_store_session(
    session_store: SessionStore, description: str, file_contents: bytes
) -> Tuple[str, SessionData]:
    """Processes a dataset, creates session data, and stores it."""
    session_id = str(uuid.uuid4())
    df = pl.read_csv(BytesIO(file_contents))

    describe_df = df.describe()
    all_descriptions = _create_column_descriptions(describe_df)

    columns = [
        ColumnInfo(name=name, dtype=str(dtype), description=all_descriptions.get(name))
        for name, dtype in df.schema.items()
    ]

    summary_str = _format_dataset_summary(description, df.height, columns)
    session_data = SessionData(summary=summary_str, columns=columns)
    session_data_str = session_data.model_dump_json()
    logging.debug(f"Started Session:\n\tID: {session_id}\n\tSession Data: {session_data_str}")
    session_store.save_data(session_id, session_data_str)

    return session_id, session_data


def get_session_data(
    session_store: SessionStore, session_id: str
) -> SessionData | None:
    """Retrieves and parses session data from storage."""
    json_data = session_store.get_data(session_id)
    if json_data:
        return SessionData(**json.loads(json_data))
    return None
