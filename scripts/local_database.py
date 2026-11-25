"""Connect to the local PostgreSQL database and apply Aftro migrations."""

import getpass
import os
from pathlib import Path

import psycopg
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
    migrations = ROOT / "database" / "migrations"
    with psycopg.connect(dsn, autocommit=True, connect_timeout=4) as connection:
        # Hold the session lock until setup and migrations finish.
        connection.execute("SELECT pg_advisory_lock(802113467)")
        with connection.transaction():
            connection.execute((catalog / "001_create_catalog.sql").read_text(encoding="utf-8"))
            connection.execute((catalog / "002_seed_demo_catalog.sql").read_text(encoding="utf-8"))
        for migration in sorted(migrations.glob("*.sql")):
            connection.execute(migration.read_text(encoding="utf-8"))
        return connection.info.dbname
