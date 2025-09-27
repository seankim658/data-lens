import logging
import openai
from openai.types.chat import ChatCompletionMessageParam
from typing import List, Dict, Any, cast
from enum import Enum

from core.config import settings
from providers.base import LLMProvider, MAX_TOKENS


class OpenAIModel(Enum):
    GPT5MINI = "gpt-5-mini"


class OpenAIProvider(LLMProvider):
    """Concrete implementation for the OpenAI LLM API."""

    def __init__(self, model: OpenAIModel | str = OpenAIModel.GPT5MINI):
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not set in environment variables.")
        self.client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = model if isinstance(model, str) else model.value

    async def generate_explanation(self, messages: List[Dict[str, Any]]) -> str:
        """Calls the OpenAI Chat Completions API with the given messages."""
        logging.debug(f"Messages for chat:\n{messages}")
        try:
            typed_messages = cast(List[ChatCompletionMessageParam], messages)
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=typed_messages,
                max_completion_tokens=MAX_TOKENS,
            )
            logging.debug(f"LLM Response:\n{response}")
            content = response.choices[0].message.content
            return content.strip() if content else ""
        except Exception as e:
            logging.error(f"Error calling OpenAI API: {e}")
            raise
