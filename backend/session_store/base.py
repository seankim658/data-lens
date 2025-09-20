from abc import ABC, abstractmethod


class SessionStore(ABC):
    @abstractmethod
    def save_summary(self, session_id: str, summary: str):
        pass

    @abstractmethod
    def get_summary(self, session_id: str) -> str | None:
        pass
