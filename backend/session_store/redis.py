from redis import Redis
from session_store.base import SessionStore
from config import settings


class RedisSessionStore(SessionStore):
    def __init__(self) -> None:
        self._client: Redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)

    def save_summary(self, session_id: str, summary: str):
        self._client.set(session_id, summary, ex=3600)

    def get_summary(self, session_id: str) -> str | None:
        summary = self._client.get(session_id)
        return str(summary) if summary else None
