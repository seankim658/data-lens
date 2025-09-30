from abc import ABC, abstractmethod

# TODO : Still need a solution to clean orphaned data files
# Could use redis keyscape notifications subclass TTLCache to override popitem
# TTLCache operates on a lazy model so cleanups still wouldn't be timely
# Could also just run cleanup script on a cron job

class SessionStore(ABC):
    @abstractmethod
    def save_data(self, session_id: str, data: str):
        pass

    @abstractmethod
    def get_data(self, session_id: str) -> str | None:
        pass

    @abstractmethod
    def delete_data(self, session_id: str):
        pass
