import logging
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request, Depends
from slowapi import Limiter
from slowapi.util import get_remote_address

from .util import get_session_store, get_llm_provider
from session_store.base import SessionStore
from providers.base import LLMProvider

from domains.chat.models import ChatPayload
from domains.chat.service import get_chat_response
from domains.lenses.models import LensConfig, EvaluationContext
from domains.lenses.service import (
    get_all_lenses_from_cache,
    LensNotFoundError,
    get_compatible_lenses,
)
from domains.analysis.models import InteractionPayload
from domains.analysis.service import get_ai_explanation
from domains.session.service import create_and_store_session, get_session_data
from domains.session.models import ChatMessage, AnalysisRecord, SessionData

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/upload", response_model=Dict[str, Any])
@limiter.limit("5/minute")
async def upload_dataset(
    request: Request,
    description: str = Form(...),
    file: UploadFile = File(...),
    session_store: SessionStore = Depends(get_session_store),
):
    logging.info(f"Recieved upload request for file: {file.filename}")
    try:
        contents = await file.read()
        session_id, session_data = create_and_store_session(
            session_store, description, contents
        )
        logging.info(f"Successfully created session {session_id}")
        return {"session_id": session_id, "data": session_data}
    except Exception as e:
        logging.error(f"Failed to process file upload: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Failed to process file: {e}")


@router.post("/chat/query")
@limiter.limit("30/minute")
async def chat_with_assistant(
    request: Request,
    payload: ChatPayload,
    session_store: SessionStore = Depends(get_session_store),
    llm_provider: LLMProvider = Depends(get_llm_provider),
):
    logging.info(f"Received chat message for session {payload.session_id}")
    session_data = get_session_data(session_store, payload.session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        ai_response = await get_chat_response(
            llm_provider, session_data, payload.message
        )

        session_data.chat_history.append(
            ChatMessage(role="user", content=payload.message)
        )
        session_data.chat_history.append(
            ChatMessage(role="assistant", content=ai_response)
        )
        session_store.save_data(payload.session_id, session_data.model_dump_json())

        return {"response": ai_response}

    except Exception as e:
        logging.error(f"Internal server error during chat: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred")


@router.post("/analyze")
@limiter.limit("10/minute")
async def analyze_interaction(
    request: Request,
    payload: InteractionPayload,
    session_store: SessionStore = Depends(get_session_store),
    llm_provider: LLMProvider = Depends(get_llm_provider),
):
    logging.info(f"Received request for tool '{payload.tool}'")
    session_data = get_session_data(session_store, payload.session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        explanation, correctness = await get_ai_explanation(
            llm_provider, payload, session_data.summary
        )
        lens_config = get_all_lenses_from_cache()
        # Should probably do this better later
        lens_name = next(
            (lens.name for lens in lens_config if lens.id == payload.tool),
            "Unknown Lens",
        )

        analysis_record = AnalysisRecord(
            lens_id=payload.tool,
            lens_name=lens_name,
            user_hypothesis=payload.user_hypothesis or "N/A",
            ai_summary=explanation,
            correctness=correctness,
        )
        session_data.analysis_log.append(analysis_record)
        session_store.save_data(payload.session_id, session_data.model_dump_json())

        return {"explanation": explanation, "correctness": correctness}

    except LensNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logging.error(f"Internal server error during analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred")


@router.post("/lenses/compatible", response_model=List[LensConfig])
async def list_compatible_lenses(request: Request, context: EvaluationContext):
    """Accepts a context object and returns a list of lenses whose compatability rules pass."""
    logging.debug(f"Fetching compatible lenses for context: {context.model_dump()}")
    try:
        return get_compatible_lenses(context)
    except Exception as e:
        logging.error(f"Failed to get compatible lenses: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail="Failed to evaluate lens compatability"
        )


@router.get("/lenses/all", response_model=List[LensConfig])
async def list_lenses(request: Request):
    """Returns a list of all available lens configurations from the cache."""
    logging.debug("Fetching all available lens configurations")
    return get_all_lenses_from_cache()
