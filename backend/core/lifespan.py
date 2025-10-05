import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI

from . import logger
from core.config import settings
from domains.lenses.service import load_lenses_into_cache
from domains.session.service import initialize_session_store, load_preloaded_datasets_into_cache
from domains.analysis.service import initialize_llm_provider


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles startup and shutdown."""
    logger.setup_logging(settings.LOG_LEVEL)
    logging.info("Application starting up...")

    app.state.session_store = initialize_session_store()
    app.state.llm_provider = initialize_llm_provider()

    load_lenses_into_cache()
    load_preloaded_datasets_into_cache()

    logging.info("Application startup complete")
    yield
    logging.info("Application shutting down...")
