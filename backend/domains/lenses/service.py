import logging
import yaml
from pathlib import Path
from typing import List, Dict, Any
from pydantic import ValidationError
from .models import LensConfig

LENSES_DIR = Path(__file__).parents[2] / "lenses"
_LENS_CACHE: List[LensConfig] = []  # TODO : maybe make this more robust later


class LensNotFoundError(Exception):
    pass


def load_lenses_into_cache() -> None:
    """Scans the lenses directory, parses each yml file, and stores it in memory."""
    global _LENS_CACHE
    logging.info("Loading all lens configurations into cache...")
    _LENS_CACHE = []
    for f in LENSES_DIR.glob("*.yml"):
        try:
            with open(f, "r") as file:
                data = yaml.safe_load(file)
                _LENS_CACHE.append(LensConfig(**data))
        except (ValidationError, TypeError) as e:
            logging.error(
                f"Failed to load and cache lens '{f.stem}': Invalid configuration - {e}"
            )
        except Exception as e:
            logging.error(
                f"An unexpected error occurred while loading lens '{f.stem}': {e}"
            )
    logging.info(f"Successfully cached {len(_LENS_CACHE)} lenses")


def get_all_lenses_from_cache() -> List[LensConfig]:
    """Returns the list of all lenses from the cache."""
    if not _LENS_CACHE:
        logging.warning("Lens cache is empty")
    return _LENS_CACHE


def get_lens_by_id(lens_id: str) -> LensConfig:
    """Retrieves a single lens congiruation from the cache by its ID."""
    for lens in get_all_lenses_from_cache():
        if lens.id == lens_id:
            return lens
    raise LensNotFoundError(f"Lens configuration for '{lens_id}' not found in cache")


# --- TODO : Rule Engine (Future Implementation) ---
# All placeholders right now

def _evaluate_rule(rule: Dict[str, Any], context: Dict[str, Any]) -> bool:
    logging.debug(f"Evaluating rule: {rule} against context.")
    return True


def get_compatible_lenses(context: Dict[str, Any]) -> List[LensConfig]:
    """Filters the cached lenses based on the provided context and their compatibility rules."""
    compatible_lenses = []
    all_lenses = get_all_lenses_from_cache()

    for lens in all_lenses:
        is_compatible = all(
            _evaluate_rule(rule.model_dump(), context) for rule in lens.compatibility
        )
        if is_compatible:
            compatible_lenses.append(lens)

    return compatible_lenses
