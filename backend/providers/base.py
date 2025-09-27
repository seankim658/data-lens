from abc import ABC, abstractmethod
from typing import AsyncGenerator, List, Dict, Any

MAX_TOKENS = 5_000


class LLMProvider(ABC):
    """Abstract base class for LLM providers."""

    @abstractmethod
    async def generate_explanation(self, messages: List[Dict[str, Any]]) -> str:
        """Generates a complete explanation from the LLM."""
        pass

    @abstractmethod
    def stream_explanation(
        self, messages: List[Dict[str, Any]]
    ) -> AsyncGenerator[str, None]:
        """Generates an explanation from the LLM and yields content chunks as they arrive."""
        pass
