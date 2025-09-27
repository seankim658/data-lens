from abc import ABC, abstractmethod
from typing import List, Dict, Any

MAX_TOKENS = 5_000

class LLMProvider(ABC):
    """Abstract base class for LLM providers."""

    @abstractmethod
    async def generate_explanation(self, messages: List[Dict[str, Any]]) -> str:
        """Generates an explanation from the LLM based on a list of messages.

        Args:
            messages: A list of messgae dictionaries in the format expected by the LLM API

        Returns:
            The generated text explanation from the LLM
        """
        pass
