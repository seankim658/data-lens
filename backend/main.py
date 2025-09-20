from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

from models import InteractionPayload
from services import (
    get_ai_explanation,
    LensNotFoundError,
    initialize_llm_provider,
    create_and_store_session,
    get_summary_from_session,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles startup and shutdown events for the application."""
    print("Initializing LLM Provider...")
    initialize_llm_provider()
    yield
    print("LLM Provider shutdown...")


app = FastAPI(
    title="Data Lens API",
    description="API for analyzing data visualization interactions.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/upload")
async def upload_dataset(description: str = Form(...), file: UploadFile = File(...)):
    """Handles dataset uploads by calling the session management service."""
    try:
        contents = await file.read()
        session_id, summary = create_and_store_session(description, contents)
        return {"session_id": session_id, "summary": summary}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process file: {e}")


@app.post("/api/analyze")
async def analyze_interaction(payload: InteractionPayload):
    """Receives a user's interaction, retrieves context from the session service,
    sends to the LLM, and returns the LLM explanation.
    """
    dataset_summary = get_summary_from_session(payload.session_id)
    if not dataset_summary:
        raise HTTPException(
            status_code=404, detail="Session not found. Please upload a dataset first."
        )

    try:
        explanation = await get_ai_explanation(payload, dataset_summary)
        return {"explanation": explanation}
    except LensNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"Configuration error: {e}")
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"An internal server error occurred: {e}"
        )


@app.get("/")
def read_root():
    return {"message": "Welcome to the Data Lens API"}
