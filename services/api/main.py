"""Read-only apartment and renovation catalog."""

import os

import psycopg
from fastapi import FastAPI, HTTPException
from psycopg.rows import dict_row
from pydantic import BaseModel


class FinishPackage(BaseModel):
    slug: str
    name: str
    wall_finish: str
    floor_finish: str


class Apartment(BaseModel):
    slug: str
    name: str
    width_m: float
    length_m: float
    height_m: float
    finishes: list[FinishPackage]


app = FastAPI(title="Aftro API", version="0.1.0")


@app.get("/health/live")
def liveness() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/v1/apartments/{slug}", response_model=Apartment)
def get_apartment(slug: str) -> Apartment:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise HTTPException(status_code=503, detail="Catalog database is not configured")

    try:
        with psycopg.connect(database_url, row_factory=dict_row, connect_timeout=3) as connection:
            apartment = connection.execute(
                """
                SELECT
                    a.slug,
                    a.name,
                    a.width_m,
                    a.length_m,
                    a.height_m,
                    COALESCE(
                        (
                            SELECT jsonb_agg(
                                jsonb_build_object(
                                    'slug', f.slug,
                                    'name', f.name,
                                    'wall_finish', f.wall_finish,
                                    'floor_finish', f.floor_finish
                                ) ORDER BY f.slug
                            )
                            FROM finish_packages AS f
                            WHERE f.apartment_slug = a.slug
                        ),
                        '[]'::jsonb
                    ) AS finishes
                FROM apartments AS a
                WHERE a.slug = %s
                """,
                (slug,),
            ).fetchone()
    except psycopg.OperationalError as error:
        raise HTTPException(status_code=503, detail="Catalog database is unavailable") from error

    if apartment is None:
        raise HTTPException(status_code=404, detail="Apartment not found")

    return Apartment.model_validate(apartment)
