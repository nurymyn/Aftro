"""Verify room export import using a PostgreSQL database and the Python CLI."""

import json
import os
import subprocess
import sys
from pathlib import Path
from tempfile import TemporaryDirectory
from uuid import uuid4

import psycopg

root = Path(__file__).resolve().parents[1]
room = {
    "schema": 1,
    "id": str(uuid4()),
    "saved_at": "2026-11-25T10:30:00.000Z",
    "width": 4,
    "length": 3,
    "height": 2.5,
    "source": "camera",
    "finish": "warm",
}

with TemporaryDirectory(prefix="aftro import ") as folder:
    export = Path(folder) / "room export.json"

    def run(data, status=0):
        export.write_text(json.dumps(data), encoding="utf-8")
        result = subprocess.run(
            [sys.executable, str(root / "scripts" / "import-room.py"), str(export)],
            capture_output=True, text=True, timeout=20,
        )
        assert result.returncode == status, result.stdout + result.stderr
        return result

    assert "invalid height" in run({**room, "height": False}, 1).stderr
    assert "Room imported." in run(room).stdout
    assert "already imported" in run(room).stdout
    assert "Room imported." in run({**room, "finish": "light", "saved_at": "2026-11-25T11:00:00Z"}).stdout
    assert "already imported" in run(room).stdout

with psycopg.connect(host="127.0.0.1", dbname=os.environ["PGDATABASE"]) as connection:
    rows = connection.execute(
        "SELECT finish, floor_area, wall_area, flooring_with_allowance FROM aftro_offline_rooms WHERE id = %s",
        (room["id"],),
    ).fetchall()
    assert len(rows) == 1
    finish, floor, walls, order = rows[0]
    assert (finish, floor, walls) == ("light", 12, 35)
    assert abs(order - 13.2) < 1e-8

print("Offline import checks passed: validation, duplicates, updated rooms, and PostgreSQL quantities.")
