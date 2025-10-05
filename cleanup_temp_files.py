import os
import time
from pathlib import Path

UPLOAD_DIR = Path(__file__).parent / "temp_uploads"
MAX_FILE_AGE_SECONDS = 21_600


def run_cleanup():
    print(f"Starting cleanup of directory: {UPLOAD_DIR}")
    if not UPLOAD_DIR.exists():
        print("Upload directory does not exist, exiting...")
        return

    now = time.time()
    files_removed = 0

    for filename in os.listdir(UPLOAD_DIR):
        file_path = UPLOAD_DIR / filename
        if file_path.is_file() and file_path.suffix == ".csv":
            try:
                file_age = now - file_path.stat().st_mtime
                if file_age > MAX_FILE_AGE_SECONDS:
                    os.remove(file_path)
                    print(f"Removed old file: {filename}")
                    files_removed += 1
            except OSError as e:
                print(f"Error removing file {file_path}: {e}")

    print(f"Cleanup complete. Removed {files_removed} files.")


if __name__ == "__main__":
    run_cleanup()
