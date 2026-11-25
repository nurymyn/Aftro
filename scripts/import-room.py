"""Import an Aftro phone export directly into local PostgreSQL."""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from uuid import UUID

import psycopg

from local_database import development_connection, prepare_database


def choose_file() -> Path | None:
    try:
        from tkinter import Tk, TclError, filedialog
    except ImportError as error:
        raise ValueError("Pass the path to the exported JSON file.") from error

    try:
        window = Tk()
    except TclError as error:
        raise ValueError("Pass the path to the exported JSON file.") from error
    window.withdraw()
    try:
        selected = filedialog.askopenfilename(
            title="Select an Aftro room export",
            initialdir=Path.home() / "Downloads",
            filetypes=[("Aftro JSON export", "*.json"), ("All files", "*.*")],
        )
    finally:
        window.destroy()
    return Path(selected) if selected else None


def read_room(path: Path) -> tuple:
    with path.open("rb") as file:
        raw = file.read(65537)
    if len(raw) > 65536:
        raise ValueError("The room export exceeds 64 KB.")
    item = json.loads(raw)
    if not isinstance(item, dict) or type(item.get("schema")) is not int or item["schema"] != 1:
        raise ValueError("Select a supported Aftro room export.")

    try:
        room_id = UUID(item["id"])
        saved_at = datetime.fromisoformat(item["saved_at"].replace("Z", "+00:00"))
    except (KeyError, ValueError, TypeError, AttributeError) as error:
        raise ValueError("The room export has an invalid ID or date.") from error
    if saved_at.utcoffset() is None:
        raise ValueError("The room export date needs a time zone.")

    dimensions = []
    for name, low, high in (("width", 0.8, 20), ("length", 0.8, 20), ("height", 1.8, 6)):
        value = item.get(name)
        if type(value) not in (int, float) or not low <= value <= high:
            raise ValueError(f"The room export has an invalid {name}.")
        dimensions.append(value)
    source = item.get("source")
    finish = item.get("finish")
    if source not in ("camera", "manual") or finish not in ("before", "warm", "light"):
        raise ValueError("The room export has an invalid source or finish.")
    return room_id, saved_at, *dimensions, source, finish


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("file", nargs="?", type=Path, help="Aftro room JSON file")
    args = parser.parse_args()
    try:
        path = args.file or choose_file()
        if path is None:
            return 0
        values = read_room(path)
        dsn = development_connection()
        database = prepare_database(dsn)
        with psycopg.connect(dsn, connect_timeout=4) as connection:
            result = connection.execute(
                """
                INSERT INTO aftro_offline_rooms (id, saved_at, width, length, height, source, finish)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE
                SET saved_at = excluded.saved_at, width = excluded.width, length = excluded.length,
                    height = excluded.height, source = excluded.source, finish = excluded.finish
                WHERE excluded.saved_at > aftro_offline_rooms.saved_at
                """,
                values,
            )
        print("Room imported." if result.rowcount else "The same or a newer version is already imported.")
        print(f"PostgreSQL database: {database} | Table: public.aftro_offline_rooms")
        return 0
    except (OSError, ValueError) as error:
        print(f"Room import failed: {error}", file=sys.stderr)
    except psycopg.Error as error:
        detail = error.diag.message_primary or type(error).__name__
        print(f"PostgreSQL import failed ({detail}). Check the service and connection settings.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
