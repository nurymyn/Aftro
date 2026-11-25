"""Password accounts, verified phone registration and account preferences."""

import base64
import hashlib
import hmac
import json
import os
import re
import secrets
from contextlib import contextmanager
from threading import BoundedSemaphore
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request as ProviderRequest
from urllib.request import urlopen

import psycopg
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from psycopg.rows import dict_row
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/auth")
COOKIE = "aftro_session"
SESSION_AGE = 7 * 24 * 60 * 60
EMAIL = re.compile(r"[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+", re.ASCII)
PHONE = re.compile(r"\+[1-9][0-9]{7,14}")
CODE = re.compile(r"[0-9]{4,10}")
TOKEN = re.compile(r"[A-Za-z0-9_-]{43}")
PASSWORD_WORKERS = BoundedSemaphore(3)


class Credentials(BaseModel):
    identifier: str = Field(max_length=254)
    password: str = Field(min_length=1, max_length=128)


class Registration(Credentials):
    code: str | None = Field(default=None, max_length=10)


class PhoneNumber(BaseModel):
    phone: str = Field(max_length=32)


class FinishChoice(BaseModel):
    finish_slug: str = Field(min_length=1, max_length=128)


@contextmanager
def database():
    url = os.getenv("DATABASE_URL")
    if not url:
        raise HTTPException(503, "accounts_unavailable")
    try:
        with psycopg.connect(url, row_factory=dict_row, connect_timeout=3) as connection:
            yield connection
    except (psycopg.OperationalError, psycopg.errors.UndefinedTable) as error:
        raise HTTPException(503, "accounts_unavailable") from error


def identifier_value(raw: str) -> tuple[str, str]:
    value = raw.strip()
    if "@" in value:
        value = value.lower()
        if value.isascii() and EMAIL.fullmatch(value):
            return value, "email"
    else:
        phone = re.sub(r"[\s()-]", "", value)
        if PHONE.fullmatch(phone):
            return phone, "phone"
    raise HTTPException(422, "invalid_identifier")


def json_request(request: Request) -> None:
    # A browser cannot send this media type across origins without preflight.
    if request.headers.get("content-type", "").partition(";")[0].strip().lower() != "application/json":
        raise HTTPException(415, "json_required")


def rate_limit(action: str, subject: str, limit: int) -> None:
    fingerprint = hashlib.sha256(subject.encode()).digest()
    with database() as connection:
        row = connection.execute(
            """
            INSERT INTO aftro_auth_attempts (action, subject_hash, window_start, attempts)
            VALUES (%s, %s, now(), 1)
            ON CONFLICT (action, subject_hash) DO UPDATE
            SET attempts = CASE
                WHEN aftro_auth_attempts.window_start <= now() - interval '10 minutes' THEN 1
                ELSE aftro_auth_attempts.attempts + 1
            END,
            window_start = CASE
                WHEN aftro_auth_attempts.window_start <= now() - interval '10 minutes' THEN now()
                ELSE aftro_auth_attempts.window_start
            END
            WHERE aftro_auth_attempts.window_start <= now() - interval '10 minutes'
                OR aftro_auth_attempts.attempts < %s
            RETURNING attempts
            """,
            (action, fingerprint, limit),
        ).fetchone()
    if not row:
        raise HTTPException(429, "too_many_attempts")


def request_limit(request: Request, action: str, limit: int = 20) -> None:
    rate_limit(action, request.client.host if request.client else "unknown", limit)


def password_hash(password: str, salt: bytes) -> bytes:
    if not PASSWORD_WORKERS.acquire(blocking=False):
        raise HTTPException(429, "too_many_attempts")
    try:
        return hashlib.scrypt(password.encode(), salt=salt, n=2**15, r=8, p=3, maxmem=64 * 1024**2)
    finally:
        PASSWORD_WORKERS.release()


def token_hash(token: str | None) -> bytes | None:
    return hashlib.sha256(token.encode()).digest() if token and TOKEN.fullmatch(token) else None


def new_session(connection, request: Request, account_id: int) -> str:
    previous = token_hash(request.cookies.get(COOKIE))
    if previous:
        connection.execute("DELETE FROM aftro_sessions WHERE token_hash = %s", (previous,))
    token = secrets.token_urlsafe(32)
    connection.execute("DELETE FROM aftro_sessions WHERE expires_at <= now()")
    connection.execute(
        "INSERT INTO aftro_sessions VALUES (%s, %s, now() + (%s * interval '1 second'))",
        (token_hash(token), account_id, SESSION_AGE),
    )
    return token


def send_session(response: Response, request: Request, token: str) -> None:
    secure = request.url.scheme == "https" or os.getenv("AFTRO_SECURE_COOKIES") == "1"
    response.set_cookie(COOKIE, token, max_age=SESSION_AGE, httponly=True, secure=secure, samesite="lax")
    response.headers["Cache-Control"] = "no-store"


def get_account(request: Request) -> dict:
    digest = token_hash(request.cookies.get(COOKIE))
    if not digest:
        raise HTTPException(401, "sign_in_required")
    with database() as connection:
        account = connection.execute(
            """
            SELECT a.id, a.identifier, a.kind
            FROM aftro_accounts AS a JOIN aftro_sessions AS s ON s.account_id = a.id
            WHERE s.token_hash = %s AND s.expires_at > now()
            """,
            (digest,),
        ).fetchone()
    if account is None:
        raise HTTPException(401, "sign_in_required")
    return account


def public_account(account: dict) -> dict[str, str]:
    return {"identifier": account["identifier"], "kind": account["kind"]}


def verify_phone(step: str, phone: str, code: str | None = None) -> bool:
    sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    secret = os.getenv("TWILIO_AUTH_TOKEN", "")
    service = os.getenv("TWILIO_VERIFY_SERVICE_SID", "")
    if not (re.fullmatch(r"AC[0-9a-fA-F]{32}", sid) and re.fullmatch(r"VA[0-9a-fA-F]{32}", service) and secret):
        raise HTTPException(503, "sms_unavailable")

    path = "Verifications" if step == "start" else "VerificationCheck"
    payload = {"To": phone, **({"Channel": "sms"} if step == "start" else {"Code": code})}
    auth = base64.b64encode(f"{sid}:{secret}".encode()).decode()
    request = ProviderRequest(
        f"https://verify.twilio.com/v2/Services/{service}/{path}",
        data=urlencode(payload).encode(),
        headers={"Authorization": f"Basic {auth}", "Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=8) as result:
            status = json.load(result).get("status")
    except HTTPError as error:
        if error.code == 429:
            raise HTTPException(429, "too_many_attempts") from error
        if step == "check" and error.code in (400, 404):
            return False
        raise HTTPException(502, "sms_failed") from error
    except (URLError, TimeoutError, ValueError) as error:
        raise HTTPException(502, "sms_failed") from error
    return status == ("pending" if step == "start" else "approved")


@router.post("/phone-code", dependencies=[Depends(json_request)])
def phone_code(payload: PhoneNumber, request: Request) -> dict[str, bool]:
    phone, kind = identifier_value(payload.phone)
    if kind != "phone":
        raise HTTPException(422, "invalid_identifier")
    request_limit(request, "send-code-ip", 8)
    rate_limit("send-code-phone", phone, 3)
    if not verify_phone("start", phone):
        raise HTTPException(502, "sms_failed")
    return {"sent": True}


@router.post("/register", status_code=201, dependencies=[Depends(json_request)])
def register(payload: Registration, request: Request, response: Response) -> dict:
    identifier, kind = identifier_value(payload.identifier)
    if len(payload.password) < 15:
        raise HTTPException(422, "short_password")
    if kind == "phone" and not CODE.fullmatch(payload.code or ""):
        raise HTTPException(422, "missing_code")
    request_limit(request, "register")
    if kind == "phone":
        rate_limit("verify-code", identifier, 6)
        if not verify_phone("check", identifier, payload.code):
            raise HTTPException(400, "invalid_code")

    salt = secrets.token_bytes(16)
    digest = password_hash(payload.password, salt)
    with database() as connection:
        account = connection.execute(
            """
            INSERT INTO aftro_accounts (identifier, kind, password_salt, password_hash)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (identifier) DO NOTHING
            RETURNING id, identifier, kind
            """,
            (identifier, kind, salt, digest),
        ).fetchone()
        if account is None:
            raise HTTPException(409, "account_exists")
        token = new_session(connection, request, account["id"])
    send_session(response, request, token)
    return public_account(account)


@router.post("/login", dependencies=[Depends(json_request)])
def login(payload: Credentials, request: Request, response: Response) -> dict:
    identifier, _ = identifier_value(payload.identifier)
    request_limit(request, "login")
    with database() as connection:
        account = connection.execute(
            "SELECT id, kind, identifier, password_salt, password_hash FROM aftro_accounts WHERE identifier = %s",
            (identifier,),
        ).fetchone()
    actual = password_hash(payload.password, bytes(account["password_salt"]) if account else bytes(16))
    expected = bytes(account["password_hash"]) if account else bytes(len(actual))
    if not hmac.compare_digest(actual, expected) or account is None:
        raise HTTPException(401, "incorrect_credentials")
    with database() as connection:
        token = new_session(connection, request, account["id"])
    send_session(response, request, token)
    return public_account(account)


@router.post("/logout", status_code=204, dependencies=[Depends(json_request)])
def logout(request: Request, response: Response) -> None:
    digest = token_hash(request.cookies.get(COOKIE))
    if digest:
        with database() as connection:
            connection.execute("DELETE FROM aftro_sessions WHERE token_hash = %s", (digest,))
    response.delete_cookie(COOKIE)
    response.headers["Cache-Control"] = "no-store"


@router.get("/me")
def me(response: Response, account: dict = Depends(get_account)) -> dict:
    response.headers["Cache-Control"] = "no-store"
    return public_account(account)


@router.get("/finishes/{apartment_slug}")
def saved_finish(apartment_slug: str, response: Response, account: dict = Depends(get_account)) -> dict:
    response.headers["Cache-Control"] = "no-store"
    with database() as connection:
        value = connection.execute(
            "SELECT finish_slug FROM aftro_saved_finishes WHERE account_id = %s AND apartment_slug = %s",
            (account["id"], apartment_slug),
        ).fetchone()
    return value or {"finish_slug": None}


@router.put("/finishes/{apartment_slug}", dependencies=[Depends(json_request)])
def save_finish(apartment_slug: str, payload: FinishChoice, account: dict = Depends(get_account)) -> dict:
    try:
        with database() as connection:
            connection.execute(
                """
                INSERT INTO aftro_saved_finishes (account_id, apartment_slug, finish_slug)
                VALUES (%s, %s, %s)
                ON CONFLICT (account_id, apartment_slug)
                DO UPDATE SET finish_slug = excluded.finish_slug
                """,
                (account["id"], apartment_slug, payload.finish_slug),
            )
    except psycopg.errors.ForeignKeyViolation as error:
        raise HTTPException(404, "finish_not_found") from error
    return {"finish_slug": payload.finish_slug}
