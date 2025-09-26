from typing import Dict
from session_store.base import SessionStore


class InMemorySessionStore(SessionStore):
    def __init__(self) -> None:
        self._storage: Dict[str, str] = {}

    def save_data(self, session_id: str, data: str):
        self._storage[session_id] = data

    def get_data(self, session_id: str) -> str | None:
        return self._storage.get(session_id)
