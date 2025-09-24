from fastapi import Request
from session_store.base import SessionStore
from providers.base import LLMProvider


def get_session_store(request: Request) -> SessionStore:
    return request.app.state.session_store


def get_llm_provider(request: Request) -> LLMProvider:
    return request.app.state.llm_provider
