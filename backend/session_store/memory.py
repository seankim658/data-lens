from typing import Dict
from session_store.base import SessionStore


class InMemorySessionStore(SessionStore):
    def __init__(self) -> None:
        self._storage: Dict[str, str] = {}

    def save_summary(self, session_id: str, summary: str):
        self._storage[session_id] = summary

    def get_summary(self, session_id: str) -> str | None:
        return self._storage.get(session_id)
