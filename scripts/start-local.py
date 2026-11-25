"""Prepare Aftro in a local PostgreSQL service and start the API."""

import argparse
import getpass
import os
import sys
from pathlib import Path

import psycopg
import uvicorn
from psycopg import sql
from psycopg.conninfo import make_conninfo

ROOT = Path(__file__).resolve().parents[1]


def development_connection() -> str:
    configured = os.environ.get("DATABASE_URL")
    if configured:
        return configured

    database = os.environ.get("PGDATABASE", "aftro")
    user = os.environ.get("PGUSER", "postgres")
    password = os.environ.get("PGPASSWORD")
    if password is None:
        password = getpass.getpass(f"PostgreSQL password for {user}: ")

    settings = {
        "host": os.environ.get("PGHOST", "127.0.0.1"),
        "port": os.environ.get("PGPORT", "5432"),
        "user": user,
        "connect_timeout": 4,
    }
    if password:
        settings["password"] = password

    with psycopg.connect(make_conninfo(**settings, dbname="postgres"), autocommit=True) as admin:
        exists = admin.execute("SELECT 1 FROM pg_database WHERE datname = %s", (database,)).fetchone()
        if not exists:
            try:
                admin.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(database)))
            except psycopg.errors.DuplicateDatabase:
                # Another Aftro start created the database concurrently.
                pass

    return make_conninfo(**settings, dbname=database)


def prepare_database(dsn: str) -> str:
    catalog = ROOT / "database" / "init"
    accounts = ROOT / "database" / "migrations" / "001_accounts.sql"
    with psycopg.connect(dsn, autocommit=True, connect_timeout=4) as connection:
        # Hold the session lock until both setup transactions finish.
        connection.execute("SELECT pg_advisory_lock(802113467)")
        with connection.transaction():
            connection.execute((catalog / "001_create_catalog.sql").read_text(encoding="utf-8"))
            connection.execute((catalog / "002_seed_demo_catalog.sql").read_text(encoding="utf-8"))
        # The account migration contains its own transaction.
        connection.execute(accounts.read_text(encoding="utf-8"))
        return connection.info.dbname


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
