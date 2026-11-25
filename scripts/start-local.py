"""Prepare Aftro in a local PostgreSQL service and start the API."""

import argparse
import os
import sys

import psycopg
import uvicorn

from local_database import ROOT, development_connection, prepare_database


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1", help="API bind address")
    parser.add_argument("--port", type=int, default=8000, help="API port")
    parser.add_argument("--prepare-only", action="store_true", help="Initialize PostgreSQL and exit")
    args = parser.parse_args()

    try:
        dsn = development_connection()
        database = prepare_database(dsn)
    except psycopg.Error as error:
        detail = error.diag.message_primary or type(error).__name__
        print(f"PostgreSQL setup failed ({detail}). Check the service and connection settings.", file=sys.stderr)
        return 1

    print(f"PostgreSQL database ready: {database}", flush=True)
    if args.prepare_only:
        return 0

    os.environ["DATABASE_URL"] = dsn
    sys.path.insert(0, str(ROOT / "services" / "api"))
    print(f"Aftro preview: http://{args.host}:{args.port}/preview/", flush=True)
    uvicorn.run("main:app", host=args.host, port=args.port)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
