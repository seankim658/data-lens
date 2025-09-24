import uuid
import json
import polars as pl
from io import BytesIO
from typing import Tuple

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


def create_and_store_session(
    session_store: SessionStore, description: str, file_contents: bytes
) -> Tuple[str, SessionData]:
    """Processes a dataset, creates session data, and stores it."""
    session_id = str(uuid.uuid4())
    df = pl.read_csv(BytesIO(file_contents))

    columns = [
        ColumnInfo(name=name, dtype=str(dtype)) for name, dtype in df.schema.items()
    ]

    full_summary = (
        f"User description: {description}\n\nStatistical Summary:\n{str(df.describe())}"
    )

    session_data = SessionData(summary=full_summary, columns=columns)
    session_store.save_data(session_id, session_data.model_dump_json())

    return session_id, session_data


def get_session_data(
    session_store: SessionStore, session_id: str
) -> SessionData | None:
    """Retrieves and parses session data from storage."""
    json_data = session_store.get_data(session_id)
    if json_data:
        return SessionData(**json.loads(json_data))
    return None
