from abc import ABC, abstractmethod


class SessionStore(ABC):
    @abstractmethod
    def save_data(self, session_id: str, data: str):
        pass

    @abstractmethod
    def get_data(self, session_id: str) -> str | None:
        pass
