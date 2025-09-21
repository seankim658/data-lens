import logging
import yaml
import uuid
import polars as pl
from io import BytesIO
from pathlib import Path
from typing import Dict, Any, List, Tuple
from pydantic import ValidationError

from config import settings
from models import InteractionPayload, LensConfig
from session_store.base import SessionStore
from session_store.memory import InMemorySessionStore
from session_store.redis import RedisSessionStore
from providers.base import LLMProvider
from providers.openai import OpenAIProvider

LENSES_DIR = Path(__file__).parent / "lenses"
SESSION_STORAGE: Dict[str, str] = {}

DEFAULT_SYSTEM_PROMPT = """
You are the AI Assistant for "Data Lens", an interactive toolkit for data literacy. Users inspect 
the data visualized in different formats, formulate hypothesis, and apply "lenses" to the dta 
visualization. A lens is a specific data visualization action to see how different representations 
of data can lead to potential "dark patterns" that cause passive consumers to form false narratives. 
Your role is to be a helpful and insightful guide to help people understand how critically think and interpret
data visualizations, charts, and graphs. Explain the underlying data literacy concepts clearly, 
constructively, and concisely, using Markdown for formatting. Your goal is to help the user understand
the 'why' behind a data visualiation principle. If provided content and queries unrelated to the Data
Lens tool, mention that this is outside your scope.
"""

BASE_PROMPT_TEMPLATE = """
A user is using the "Data Lens" tool to learn about data literacy.
Please analyze their action based on the provided "before" and "after" images of the chart.

Here is the context for the dataset they are using:
--- DATASET CONTEXT ---
{dataset_summary}
-----------------------

Here is the user's stated hypothesis for their action:
--- USER HYPOTHESIS ---
{user_hypothesis}
-----------------------

The specific action they took is described below. Please evaluate their action and hypothesis,
explain the relevant data literacy concept, and provide a clear, educational explanation.
--- LENS-SPECIFIC DETAILS ---
{lens_specific_prompt}
-----------------------
"""

_llm_provider: LLMProvider
_session_store: SessionStore


def initialize_session_store():
    """Initializes the session based on settings."""
    global _session_store
    store_type = settings.SESSION_STORE_TYPE.lower().strip()
    match store_type:
        case "redis":
            _session_store = RedisSessionStore()
        case "memory":
            _session_store = InMemorySessionStore()
        case _:
            _session_store = InMemorySessionStore()


def initialize_llm_provider():
    """Initializes the LLM provider based on settings."""
    global _llm_provider
    provider_name = settings.API_SOURCE.lower().strip()

    match provider_name:
        case "openai":
            _llm_provider = OpenAIProvider()
        case _:
            _llm_provider = OpenAIProvider()


class LensNotFoundError(Exception):
    """Custom exception for when a lens config file is not found."""

    pass


def _load_lens_config(tool_id: str) -> LensConfig:
    """Loads a lens configuration file from the 'lenses' directory."""
    config_path = LENSES_DIR / f"{tool_id}.yml"
    if not config_path.exists():
        raise LensNotFoundError(f"Lens configuration for '{tool_id}' not found.")

    with open(config_path, "r") as f:
        data = yaml.safe_load(f)
        try:
            return LensConfig(**data)
        except ValidationError as e:
            raise ValueError(f"Invalid lens configuration for '{tool_id}': {e}")


async def get_ai_explanation(payload: InteractionPayload, dataset_summary: str) -> str:
    """Generates an explanation from the LLM based on the user's interaction."""
    lens_config = _load_lens_config(payload.tool)
    lens_prompt_template = lens_config.lens_specific_prompt

    populated_lens_prompt = lens_prompt_template.format(details=payload.details)

    full_prompt = BASE_PROMPT_TEMPLATE.format(
        dataset_summary=dataset_summary,
        user_hypothesis=payload.user_hypothesis or "No hypothesis was provided.",
        lens_specific_prompt=populated_lens_prompt,
    )

    messages: List[Dict[str, str | List[Any]]] = [
        {"role": "system", "content": DEFAULT_SYSTEM_PROMPT},
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
        return await _llm_provider.generate_explanation(messages)
    except Exception as e:
        logging.error(f"Error during AI explanation generation: {e}", exc_info=True)
        return "Sorry, I encountered an error while analyzing your action."


def create_and_store_session(description: str, file_contents: bytes) -> Tuple[str, str]:
    """Processes a dataset, creates a summary, stores it in a new session, and returns
    the session ID and summary.
    """
    session_id = str(uuid.uuid4())

    df = pl.read_csv(BytesIO(file_contents))
    stats_summary = str(df.describe())
    full_summary = (
        f"User Description: {description}\n\nStatistical Summary:\n{stats_summary}"
    )

    _session_store.save_summary(session_id, full_summary)

    return session_id, full_summary


def get_summary_from_session(session_id: str) -> str | None:
    """Retrieves a dataset summary from the session storage."""
    return _session_store.get_summary(session_id)
