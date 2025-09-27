import logging.config
from typing import Literal


class EnsureCorrelationIdFilter(logging.Filter):
    """A logging filter that ensures every log record has a 'correlation_id' attribute.
    If the attribute is missing, it sets a default value.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        if not hasattr(record, "correlation_id"):
            record.correlation_id = "-"
        return True


def setup_logging(level: Literal["debug", "info", "warning", "error"] = "info") -> None:
    """Configures the application logging with a request ID filter."""
    log_level = level.upper()

    LOGGING_CONFIG = {
        "version": 1,
        "disable_existing_loggers": False,
        "filters": {
            "correlation_id": {
                "()": "asgi_correlation_id.log_filters.CorrelationIdFilter",
                "uuid_length": 32,
                "default_value": "-",
            },
            "ensure_correlation_id": {
                "()": EnsureCorrelationIdFilter,
            },
        },
        "formatters": {
            "default": {
                "format": "%(asctime)s - [%(levelname)s] - [%(correlation_id)s] - %(name)s - %(message)s",
            },
            "simple": {
                "format": "%(asctime)s - [%(levelname)s] - %(name)s - %(message)s",
            },
        },
        "handlers": {
            "default": {
                "class": "logging.StreamHandler",
                "formatter": "default",
                "filters": ["correlation_id", "ensure_correlation_id"],
                "stream": "ext://sys.stdout",
            },
            "simple": {
                "class": "logging.StreamHandler",
                "formatter": "simple",
                "stream": "ext://sys.stdout",
            },
        },
        "loggers": {
            "uvicorn": {"handlers": ["simple"], "level": "INFO", "propagate": False},
            "httpx": {"handlers": ["simple"], "level": "INFO", "propagate": False},
            "httpcore": {"handlers": ["simple"], "level": "INFO", "propagate": False},
            "python_multipart": {
                "handlers": ["simple"],
                "level": "INFO",
                "propagate": False,
            },
        },
        "root": {
            "level": log_level,
            "handlers": ["default"],
        },
    }

    logging.config.dictConfig(LOGGING_CONFIG)
