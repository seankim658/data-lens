import logging
import sys
from contextvars import ContextVar

request_id_var: ContextVar[str] = ContextVar("request_id", default="")


class RequestIDFilter(logging.Filter):
    """Inject the request_id into the log record."""

    def filter(self, record):
        record.request_id = request_id_var.get()
        return True


def setup_logging() -> None:
    """Configures the application logging with a request ID filter."""
    # Remove any existing handlers
    for handler in logging.root.handlers[:]:
        logging.root.removeHandler(handler)

    # Add custom filter
    request_id_filter = RequestIDFilter()
    logging.getLogger().addFilter(request_id_filter)

    # Configure the formatter to include the request_id
    formatter = logging.Formatter(
        "%(asctime)s - [%(levelname)s] - [%(request_id)s] - %(name)s - %(message)s"
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    logging.basicConfig(level=logging.INFO, handlers=[handler])
