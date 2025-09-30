import logging
from typing import AsyncGenerator, List, Dict, Any, Optional

from .prompts import CHAT_SYSTEM_PROMPT, STEP_SPECIFIC_PROMPTS
from domains.lenses.service import get_all_lenses_from_cache
from domains.session.models import SessionData
from providers.base import LLMProvider


def _build_chat_system_prompt(
    session_data: SessionData, step_context: Optional[str]
) -> str:
    """Formats the system prompt with charts, lenses, and step-specific context."""
    logging.debug(f"Building chat prompt:\n\tStep: {step_context}")
    chart_str = "\n".join(
        [
            f"- **{c.get('name', 'N/A')}:** {c.get('description', 'N/A')}"
            for c in session_data.supported_charts
        ]
    )
    lenses = get_all_lenses_from_cache()
    lens_str = "\n".join([f"- **{lens.name}:** {lens.description}" for lens in lenses])

    step_prompt = ""
    current_step = step_context or session_data.current_step
    if current_step:
        step_prompt = STEP_SPECIFIC_PROMPTS.get(current_step, "")

        if "{chart_name}" in step_prompt and session_data.selected_chart_type:
            chart_config = next(
                (
                    c
                    for c in session_data.supported_charts
                    if c.get("id") == session_data.selected_chart_type
                ),
                None,
            )
            chart_name = (
                chart_config.get("name", "the selected")
                if chart_config
                else "the selected"
            )
            step_prompt = step_prompt.replace("{chart_name}", chart_name)

        if "{axes_description}" in step_prompt and session_data.selected_chart_type:
            chart_config = next(
                (
                    c
                    for c in session_data.supported_charts
                    if c.get("id") == session_data.selected_chart_type
                ),
                None,
            )
            if chart_config and "axes" in chart_config:
                axes_desc = ", ".join(
                    [f"'{ax.get('title')}'" for ax in chart_config["axes"]]
                )
                step_prompt = step_prompt.replace("{axes_description}", axes_desc)

    prompt = CHAT_SYSTEM_PROMPT.format(
        supported_charts=chart_str,
        supported_lenses=lens_str,
        step_specific_context=step_prompt,
    )

    return prompt


async def get_chat_response(
    llm_provider: LLMProvider,
    session_data: SessionData,
    user_message: str,
    step_context: Optional[str],
) -> AsyncGenerator[str, None]:
    """Generates a conversational response from the LLM, maintaining chat history."""
    system_prompt = _build_chat_system_prompt(session_data, step_context)
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
