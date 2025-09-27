import logging
from typing import List, Dict, Any, Literal, Tuple

from .models import InteractionPayload
from .prompts import LENS_SYSTEM_PROMPT, BASE_PROMPT_TEMPLATE
from ..lenses.service import get_lens_by_id
from providers.base import LLMProvider
from providers.openai import OpenAIProvider
from core.config import settings


def initialize_llm_provider() -> LLMProvider:
    """Initializes the LLM provider."""
    provider_name = settings.API_SOURCE.lower().strip()

    match provider_name:
        case "openai":
            return OpenAIProvider()
        case _:
            return OpenAIProvider()


async def get_ai_explanation(
    llm_provider: LLMProvider, payload: InteractionPayload, dataset_summary: str
) -> Tuple[str, Literal["correct", "partially_correct", "incorrect"]]:
    """Generates an explanation from the LLM based on the user's lens interaction."""
    lens_config = get_lens_by_id(payload.tool)
    lens_prompt_template = lens_config.lens_prompt

    populated_lens_prompt = lens_prompt_template.format(details=payload.details)

    full_prompt = BASE_PROMPT_TEMPLATE.format(
        dataset_summary=dataset_summary,
        user_hypothesis=payload.user_hypothesis or "No hypothesis was provided",
        lens_specific_prompt=populated_lens_prompt,
    )

    messages: List[Dict[str, Any]] = [
        {"role": "system", "content": LENS_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": full_prompt},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{payload.before_image_base64}"
                    },
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{payload.after_image_base64}"
                    },
                },
            ],
        },
    ]

    try:
        raw_response = await llm_provider.generate_explanation(messages)

        parts = raw_response.split(":", 1)
        classification_str = parts[0].strip().lower()
        explanation = parts[1].strip() if len(parts) > 1 else raw_response

        correctness: Literal["correct", "partially_correct", "incorrect"] = "incorrect"
        if classification_str == "correct":
            correctness = "correct"
        elif classification_str == "partially_correct":
            correctness = "partially_correct"

        # TODO : should we do a retry prompt on response structure failure

        return explanation, correctness

    except Exception as e:
        logging.error(f"Error during AI explanation generation: {e}", exc_info=True)
        return "Sorry, I encountered an error while analyzing your action.", "incorrect"
