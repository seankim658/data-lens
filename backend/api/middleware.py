import uuid
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from core.logger import request_id_var


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Injects a unique request_id into every incoming request's context."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Get the request_id from header or generate a new one
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        # Set the context variable
        token = request_id_var.set(request_id)

        # Set the context variable
        response = await call_next(request)
        # Add to the response headers
        response.headers["X-Request-ID"] = request_id
        request_id_var.reset(token)

        return response
