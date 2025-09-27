import logging
from typing import AsyncGenerator, List, Dict, Any

from .prompts import CHAT_SYSTEM_PROMPT
from domains.lenses.service import get_all_lenses_from_cache
from domains.session.models import SessionData
from providers.base import LLMProvider


def _format_prompt_tools(session_data: SessionData) -> str:
    """Formats the available charts and lenses into the system prompt."""
    chart_str = "\n".join(
        [
            f"- **{chart.get('name', 'Unknown')}:** {chart.get('description', 'No description')}"
            for chart in session_data.supported_charts
        ]
    )

    lenses = get_all_lenses_from_cache()
    lens_str = "\n".join([f"- **{lens.name}:** {lens.description}" for lens in lenses])

    return CHAT_SYSTEM_PROMPT.format(
        supported_charts=chart_str, supported_lenses=lens_str
    )


async def get_chat_response(
    llm_provider: LLMProvider, session_data: SessionData, user_message: str
) -> AsyncGenerator[str, None]:
    """Generates a conversational response from the LLM, maintaining chat history."""
    system_prompt = _format_prompt_tools(session_data)
    messages: List[Dict[str, Any]] = [
        {"role": "system", "content": system_prompt},
        {"role": "system", "content": f"DATASET CONTEXT:\n{session_data.summary}"},
    ]

    for msg in session_data.chat_history:
        # TODO : will eventually have to add some logic to prevent passing too many tokens
        messages.append({"role": msg.role, "content": msg.content})

    messages.append({"role": "user", "content": user_message})

    try:
        async for chunk in llm_provider.stream_explanation(messages):
            yield chunk
    except Exception as e:
        logging.error(f"Error during chat response generation: {e}", exc_info=True)
        yield "Sorry, I encountered an error. Please try again in a moment."
