import logging
from typing import List
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from models import InteractionPayload, LensConfig
from services import (
    get_ai_explanation,
    LensNotFoundError,
    get_all_lens_configs,
    initialize_llm_provider,
    create_and_store_session,
    get_session_data,
    initialize_session_store,
)
from logger import setup_logging
from middleware import RequestIDMiddleware

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles startup and shutdown events for the application."""
    setup_logging()
    logging.info("Initializing services...")
    initialize_session_store()
    initialize_llm_provider()
    yield
    print("Services shutdown...")


app = FastAPI(
    title="Data Lens API",
    description="API for analyzing data visualization interactions.",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore

app.add_middleware(RequestIDMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/upload")
@limiter.limit("5/minute")
async def upload_dataset(
    request: Request, description: str = Form(...), file: UploadFile = File(...)
):
    """Handles dataset uploads by calling the session management service."""
    logging.info(f"Received upload request for file: {file.filename}")
    try:
        contents = await file.read()
        session_id, summary = create_and_store_session(description, contents)
        logging.info(f"Successfully created session {session_id}")
        return {"session_id": session_id, "summary": summary}
    except Exception as e:
        logging.error(f"Failed to process file upload: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Failed to process file: {e}")


@app.post("/api/analyze")
@limiter.limit("10/minute")
async def analyze_interaction(request: Request, payload: InteractionPayload):
    """Receives a user's interaction, retrieves context from the session service,
    sends to the LLM, and returns the LLM explanation.
    """
    logging.info(f"Received analysis request for tool '{payload.tool}'")
    session_data = get_session_data(payload.session_id)
    if not session_data:
        logging.warning(f"Session not found for session_id: '{payload.session_id}'")
        raise HTTPException(
            status_code=404, detail="Session not found. Please upload a dataset first."
        )

    dataset_summary = session_data.summary
    try:
        explanation = await get_ai_explanation(payload, dataset_summary)
        logging.debug("Successfully generated AI explanation")
        return {"explanation": explanation}
    except LensNotFoundError as e:
        logging.warning(f"Lens not found: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        logging.error(f"Configuration error during analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Configuration error: {e}")
    except Exception as e:
        logging.error(f"Internal server error during analysis: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"An internal server error occurred: {e}"
        )


@app.get("/api/lenses", response_model=List[LensConfig])
async def list_lenses(request: Request):
    """Returns a list of all available lens configurations."""
    logging.info("Fetching all available lens configurations")
    return get_all_lens_configs()


@app.get("/")
def read_root():
    return {"message": "Welcome to the Data Lens API"}
