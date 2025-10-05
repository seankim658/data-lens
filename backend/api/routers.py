import logging
import json
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request, Depends
from fastapi.responses import StreamingResponse
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
    get_lens_by_id,
)
from domains.analysis.models import InteractionPayload
from domains.analysis.service import get_ai_explanation
from domains.session.service import (
    create_and_store_session,
    get_processed_chart_data,
    get_session_data,
    clear_session,
)
from domains.session.models import (
    ChatMessage,
    AnalysisRecord,
    SessionData,
    ChartDataPayload,
    SessionStateUpdatePayload,
)

MAX_FILE_SIZE = 30 * 1024 * 1024

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


# TODO : add some security checks before ingesting file
@router.post("/upload", response_model=Dict[str, Any])
@limiter.limit("5/minute")
async def upload_dataset(
    request: Request,
    description: str = Form(...),
    file: UploadFile = File(...),
    supported_charts_json: str = Form(...),
    session_store: SessionStore = Depends(get_session_store),
):
    logging.info(f"Recieved upload request for file: {file.filename}")

    if not file.size:
        raise HTTPException(status_code=400, detail="Could not determine file size.")

    if file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File size exceeds the limit of {MAX_FILE_SIZE / 1024 / 1024} MB.",
        )

    try:
        contents = await file.read()
        supported_charts = json.loads(supported_charts_json)
        session_id, session_data = create_and_store_session(
            session_store, description, contents, supported_charts
        )
        logging.info(f"Successfully created session {session_id}")
        return {"session_id": session_id, "data": session_data}
    except Exception as e:
        logging.error(f"Failed to process file upload: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Failed to process file: {e}")


@router.post("/session/state", response_model=SessionData)
async def update_session_state(
    request: Request,
    payload: SessionStateUpdatePayload,
    session_store: SessionStore = Depends(get_session_store),
):
    """Updates the state of a given session (e.g., current step, chart selection)."""
    logging.info(f"Updating state for session {payload.session_id}")
    session_data = get_session_data(session_store, payload.session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")
    logging.debug(f"Previous:\n{session_data}")

    # Update fields if they are provided in the payload
    update_data = payload.model_dump(exclude_unset=True, exclude={"session_id"})
    session_data = session_data.model_copy(update=update_data)
    logging.debug(f"New:\n{session_data}")

    session_store.save_data(payload.session_id, session_data.model_dump_json())
    logging.debug(f"Successfully updated session state for {payload.session_id}")
    return session_data


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

    async def stream_generator():
        full_response = ""
        try:
            async for chunk in get_chat_response(
                llm_provider,
                session_data,
                payload.message,
                payload.step_context,
                payload.sampling_configs,
                payload.aggregation_configs,
            ):
                if chunk:
                    full_response += chunk
                    lines = [f"data: {line}" for line in chunk.split("\n")]
                    formatted_sse_message = "\n".join(lines)
                    yield f"{formatted_sse_message}\n\n"

            user_msg = ChatMessage(role="user", content=payload.message)
            logging.debug(f"New user message:\n{user_msg}")
            session_data.chat_history.append(user_msg)
            assistant_msg = ChatMessage(role="assistant", content=full_response)
            logging.debug(f"New assistant message:\n{assistant_msg}")
            session_data.chat_history.append(assistant_msg)

            session_store.save_data(payload.session_id, session_data.model_dump_json())
            logging.info(
                f"Finished streaming and saved history for session {payload.session_id}"
            )

        except Exception as e:
            logging.error(
                f"Internal server error during chat stream: {e}", exc_info=True
            )
            # TODO : figure out something better here later
            yield "An error occurred.\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")


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
        lens_config = get_lens_by_id(payload.tool)
        lens_name = lens_config.name

        analysis_record = AnalysisRecord(
            lens_id=payload.tool,
            lens_name=lens_name,
            user_hypothesis=payload.user_hypothesis or "N/A",
            ai_summary=explanation,
            correctness=correctness,
        )
        logging.debug(f"New analysis record:\n{analysis_record}")
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


@router.post("/chart-data")
async def get_chart_data(
    payload: ChartDataPayload, session_store: SessionStore = Depends(get_session_store)
):
    """Processes and returns chart data based on user selections."""
    session_data = get_session_data(session_store, payload.session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        chart_data = get_processed_chart_data(
            session_data,
            payload.chart_type,
            payload.mapping,
            payload.aggregation_method,
            payload.sampling_method,
        )
        return chart_data

    except Exception as e:
        logging.error(f"Failed to get chart data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process chart data")


@router.get("/session/{session_id}", response_model=SessionData)
async def get_session(
    request: Request,
    session_id: str,
    session_store: SessionStore = Depends(get_session_store),
):
    """Retrieves the data for a given session ID."""
    logging.debug(f"Attempting to retrieve session {session_id}")
    session_data = get_session_data(session_store, session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")
    return session_data


@router.post("/session/reset")
async def reset_session(
    request: Request,
    payload: Dict[str, str],
    session_store: SessionStore = Depends(get_session_store),
):
    """Clears a user's session and deletes their uploaded data file."""
    session_id = payload.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id is required.")

    try:
        clear_session(session_store, session_id)
        return {"message": f"Session {session_id} has been reset."}
    except Exception as e:
        logging.error(f"Failed to reset session {session_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to reset session.")
