from session_store.base import SessionStore
from cachetools import TTLCache


class InMemorySessionStore(SessionStore):
    def __init__(self) -> None:
        self._storage: TTLCache[str, str] = TTLCache(maxsize=1024, ttl=360)

    def save_data(self, session_id: str, data: str):
        self._storage[session_id] = data

    def get_data(self, session_id: str) -> str | None:
        return self._storage.get(session_id)

    def delete_data(self, session_id: str):
        if session_id in self._storage:
            del self._storage[session_id]
