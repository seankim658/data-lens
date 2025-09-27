import logging
from typing import List, Dict, Any

from .prompts import CHAT_SYSTEM_PROMPT
from domains.session.models import SessionData, ChatMessage
from providers.base import LLMProvider


async def get_chat_response(
    llm_provider: LLMProvider, session_data: SessionData, user_message: str
) -> str:
    """Generates a conversational response from the LLM, maintaining chat history."""
    messages: List[Dict[str, Any]] = [
        {"role": "system", "content": CHAT_SYSTEM_PROMPT},
        {"role": "system", "content": f"DATASET CONTEXT:\n{session_data.summary}"},
    ]

    for msg in session_data.chat_history:
        # TODO : will eventually have to add some logic to prevent passing too many tokens
        messages.append({"role": msg.role, "content": msg.content})

    messages.append({"role": "user", "content": user_message})

    try:
        ai_response_content = await llm_provider.generate_explanation(messages)
        return ai_response_content
    except Exception as e:
        logging.error(f"Error during chat response generation: {e}", exc_info=True)
        return "Sorry, I encountered an error. Please try again in a moment."
