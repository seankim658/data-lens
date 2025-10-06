import logging
import os
import yaml
import uuid
import json
import polars as pl
from io import BytesIO
from typing import Any, Dict, List, Optional, Tuple
from pathlib import Path
from pydantic import ValidationError

from domains.session.models import SessionData, ColumnInfo, PreloadedDatasetInfo
from session_store.base import SessionStore
from session_store.memory_store import InMemorySessionStore
from session_store.redis_store import RedisSessionStore
from core.config import settings

UPLOAD_DIR = Path(__file__).parents[2] / "temp_uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

PRELOADED_DATASET_DIR = Path(__file__).parents[2] / "preloaded_datasets"
_PRELOADED_DATASET_CACHE: Dict[str, Tuple[Path, PreloadedDatasetInfo]] = {}


def initialize_session_store() -> SessionStore:
    """Initialize the session store."""
    store_type = settings.SESSION_STORE_TYPE.lower().strip()
    match store_type:
        case "redis":
            return RedisSessionStore()
        case "memory":
            return InMemorySessionStore()
        case _:
            return InMemorySessionStore()


def load_preloaded_datasets_into_cache() -> None:
    """Scans the preloaded_datasets directory and caches metadata."""
    global _PRELOADED_DATASET_CACHE
    logging.info("Loading all preloaded datasets into cache...")

    _PRELOADED_DATASET_CACHE = {}
    if not PRELOADED_DATASET_DIR.exists():
        logging.warning("Preloaded datasets directory not found, skipping")
        return

    metadata_file = PRELOADED_DATASET_DIR / "metadata.yml"
    if not metadata_file.exists():
        logging.warning(
            "Global metadata.yml not found in preloaded_datasets/, skipping"
        )
        return

    try:
        with open(metadata_file, "r") as f:
            all_metadata = yaml.safe_load(f)
            if not isinstance(all_metadata, list):
                logging.error("metadata.yml is not a list, skipping preloaded datasets")
                return

        for metadata in all_metadata:
            dataset_id = metadata.get("id")
            filename = metadata.get("filename")
            description = metadata.get("description")

            if not (dataset_id or filename or description):
                logging.error(
                    f"Skipping dataset due to misisng 'id', 'filename', or 'description': {metadata}"
                )
                continue

            data_path = PRELOADED_DATASET_DIR / filename
            if not data_path.exists():
                logging.error(
                    f"Data file '{filename}' for dataset '{dataset_id}' not found, skipping"
                )
                continue

            try:
                info = PreloadedDatasetInfo(**metadata)
                _PRELOADED_DATASET_CACHE[info.id] = (data_path, info)
            except ValidationError as e:
                logging.error(f"Invalid metadata for dataset '{dataset_id}': {e}")

    except Exception as e:
        logging.error(f"Error processing preloaded_datasets/metadata.yml: {e}")

    logging.info(
        f"Successfully cached {len(_PRELOADED_DATASET_CACHE)} preloaded datasets"
    )


def get_all_preloaded_datasets_from_cache() -> List[PreloadedDatasetInfo]:
    return [info for _, info in _PRELOADED_DATASET_CACHE.values()]


def get_preloaded_dataset_by_id(dataset_id: str) -> Tuple[Path, PreloadedDatasetInfo]:
    """Retrieves a specific preloaded dataset's path and info from the cache."""
    if dataset_id not in _PRELOADED_DATASET_CACHE:
        raise FileNotFoundError(f"Preloaded dataset with id '{dataset_id}' not found.")
    return _PRELOADED_DATASET_CACHE[dataset_id]


def get_df_for_session(session_data: SessionData) -> pl.DataFrame:
    """Reads a session's CSV from disk into a polars dataframe."""
    if not session_data.file_path:
        raise FileNotFoundError("No file path associated with this session.")

    file_path = Path(session_data.file_path)
    if not file_path.exists():
        raise FileNotFoundError(f"Data file not found at path: {file_path}")

    return pl.read_csv(file_path)


def _format_dataset_summary(
    description: str, row_count: int, columns: List[ColumnInfo]
) -> str:
    """Formats the dataset summary."""
    col_count = len(columns)
    schema_str = "\n".join([f"- '{c.name}' ({c.dtype})" for c in columns])

    summary = (
        f"User-provided description: {description}\n\n"
        f"The dataset has {row_count} rows and {col_count} columns.\n\n"
        f"Columns and their data types:\n{schema_str}"
    )
    return summary


def _create_column_descriptions(describe_df: pl.DataFrame) -> Dict[str, Dict[str, Any]]:
    """Transforms the polars describe dataframe to a dictionary."""
    descriptions = {}
    stat_names = describe_df.get_column("statistic").to_list()

    for col_name in describe_df.columns[1:]:
        stat_values = describe_df.get_column(col_name).to_list()

        col_description = {}
        for stat_name, value in zip(stat_names, stat_values):
            if value is not None:
                if isinstance(value, float):
                    col_description[stat_name] = f"{value:.2f}"
                else:
                    col_description[stat_name] = value
        descriptions[col_name] = col_description

    return descriptions


def get_processed_chart_data(
    session_data: SessionData,
    chart_type: str,
    mapping: Dict[str, Optional[str]],
    aggregation_method: Optional[str],
    sampling_method: Optional[str],
) -> List[Dict[str, Any]]:
    """Loads, processes, and returns data for a chart."""
    df = get_df_for_session(session_data)

    chart_config = next(
        (c for c in session_data.supported_charts if c.get("id") == chart_type), None
    )
    if not chart_config:
        raise ValueError(
            f"Chart type '{chart_type}' configuration not found in session"
        )

    sampling_threshold = chart_config.get("sampling_threshold", 5000)

    x_col = mapping.get("x") or mapping.get("category")
    y_col = mapping.get("y") or mapping.get("value")

    if not x_col or not y_col:
        raise ValueError("Incomplete column mapping provided")

    aggregated_df = apply_aggregation(
        df.select([x_col, y_col]), aggregation_method, x_col, y_col
    )

    sampled_df = apply_sampling(
        aggregated_df, sampling_method, x_col, y_col, target_size=sampling_threshold
    )

    processed_df = sampled_df.rename({x_col: "x", y_col: "y"})

    return processed_df.to_dicts()


def apply_aggregation(
    df: pl.DataFrame,
    method: Optional[str],
    category_col: str,
    value_col: str,
) -> pl.DataFrame:
    """Applies a grouping and aggregation method to a dataframe."""
    if not method:
        return df

    logging.info(f"Applying aggregation method `{method}` to dataframe")

    aggregation_map = {
        "sum": pl.sum(value_col).alias(value_col),
        "mean": pl.mean(value_col).alias(value_col),
        "count": pl.count().alias(value_col),
    }

    agg_expression = aggregation_map.get(method)
    if agg_expression is None:
        logging.warning(f"Unknown aggregation method `{method}`, skipping.")
        return df

    return df.group_by(category_col).agg(agg_expression)


# TODO : implement a random seed later
def apply_sampling(
    df: pl.DataFrame,
    method: Optional[str],
    category_col: str,
    value_col: str,
    target_size: int,
    top_n_count: int = 15,
) -> pl.DataFrame:
    """Applies a sampling or filtering method to a dataframe."""
    if not method or df.height <= target_size:
        return df.head(target_size)

    logging.info(f"Applying sampling method `{method}` to dataframe")
    match method:
        case "top_n":
            top_n_df = df.sort(value_col, descending=True).head(top_n_count)
            other_sum = df[value_col].sum() - top_n_df[value_col].sum()
            if other_sum > 0.001 and df.height > top_n_count:
                other_df = pl.DataFrame(
                    {category_col: ["Other"], value_col: [other_sum]}
                )
                return pl.concat([top_n_df, other_df])
            return top_n_df
        case "systematic":
            step = max(1, df.height // target_size)
            return df.gather_every(step)
        case "random":
            return df.sample(n=min(df.height, target_size))
        case _:
            logging.warning(
                f"Unknown sampling method `{method}`, applying default limit."
            )
            return df.head(target_size)


def create_and_store_session(
    session_store: SessionStore,
    description: str,
    file_contents: bytes,
    supported_charts: List[Dict[str, Any]],
) -> Tuple[str, SessionData]:
    """Processes a dataset, creates session data, and stores it."""
    session_id = str(uuid.uuid4())
    df = pl.read_csv(BytesIO(file_contents))

    file_path = UPLOAD_DIR / f"{session_id}.csv"
    df.write_csv(file_path)

    describe_df = df.describe()
    all_descriptions = _create_column_descriptions(describe_df)

    columns = [
        ColumnInfo(name=name, dtype=str(dtype), description=all_descriptions.get(name))
        for name, dtype in df.schema.items()
    ]

    summary_str = _format_dataset_summary(description, df.height, columns)
    session_data = SessionData(
        summary=summary_str,
        columns=columns,
        file_path=str(file_path.resolve()),
        row_count=df.height,
        supported_charts=supported_charts,
    )
    session_data_str = session_data.model_dump_json()
    logging.debug(
        f"Started Session:\n\tID: {session_id}\n\tSession Data: {session_data_str}"
    )
    session_store.save_data(session_id, session_data_str)

    return session_id, session_data


def get_session_data(
    session_store: SessionStore, session_id: str
) -> SessionData | None:
    """Retrieves and parses session data from storage."""
    json_data = session_store.get_data(session_id)
    if json_data:
        return SessionData(**json.loads(json_data))
    return None


def clear_session(session_store: SessionStore, session_id: str) -> None:
    """Deletes a session from the store and removes its associated data file."""
    session_data = get_session_data(session_store, session_id)
    if session_data and session_data.file_path:
        file_path = Path(session_data.file_path)
        if file_path.exists():
            try:
                os.remove(file_path)
                logging.info(f"Removed data file: {file_path}")
            except OSError as e:
                logging.error(f"Error removing file {file_path}: {e}")

    session_store.delete_data(session_id)
    logging.info(f"Cleared session {session_id} from store.")
