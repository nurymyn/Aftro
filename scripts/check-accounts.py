"""Exercise Aftro accounts against the running development API."""

import json
import os
from http.cookiejar import CookieJar
from urllib.error import HTTPError
from urllib.request import HTTPCookieProcessor, Request, build_opener
from uuid import uuid4

BASE = os.getenv("AFTRO_TEST_URL", "http://127.0.0.1:8000") + "/api/v1/auth"
PASSWORD = "a longer test password"


def request(client, path, status, method="GET", body=None, extra_headers=None):
    data = json.dumps(body or {}).encode() if method != "GET" else None
    headers = {"Content-Type": "application/json"} if data is not None else {}
    headers.update(extra_headers or {})
    req = Request(BASE + path, data=data, headers=headers, method=method)
    try:
        response = client.open(req, timeout=8)
    except HTTPError as error:
        response = error
    with response:
        payload = response.read()
        assert response.status == status, (path, response.status, payload)
        return json.loads(payload) if payload else None, response.headers


account = build_opener(HTTPCookieProcessor(CookieJar()))
other = build_opener(HTTPCookieProcessor(CookieJar()))
first_email = f"{uuid4().hex}@example.test"
second_email = f"{uuid4().hex}@example.test"
credentials = {"identifier": first_email, "password": PASSWORD}
finish_path = "/finishes/demo-apartment"

request(account, "/me", 401)
request(account, "/register", 422, "POST", {"identifier": "+77000000000", "password": PASSWORD})
profile, headers = request(account, "/register", 201, "POST", credentials)
assert profile == {"identifier": first_email, "kind": "email"}
assert "HttpOnly" in headers["Set-Cookie"] and "SameSite=lax" in headers["Set-Cookie"]
assert request(account, "/me", 200)[0] == profile
request(account, "/register", 409, "POST", credentials)
request(account, finish_path, 200, "PUT", {"finish_slug": "warm"})
assert request(account, finish_path, 200)[0] == {"finish_slug": "warm"}
request(account, finish_path, 404, "PUT", {"finish_slug": "missing"})
revoked_cookie = request(account, "/login", 200, "POST", credentials)[1]["Set-Cookie"].split(";", 1)[0]
request(account, "/logout", 204, "POST")
request(account, "/me", 401)
try:
    other.open(Request(BASE + "/me", headers={"Cookie": revoked_cookie}), timeout=8)
except HTTPError as error:
    assert error.code == 401
else:
    raise AssertionError("A logged-out session was accepted")
request(account, "/login", 401, "POST", {**credentials, "password": "wrong password"})
request(account, "/login", 200, "POST", {**credentials, "identifier": first_email.upper()})
assert request(account, finish_path, 200)[0] == {"finish_slug": "warm"}
request(other, "/register", 201, "POST", {"identifier": second_email, "password": PASSWORD})
assert request(other, finish_path, 200)[0] == {"finish_slug": None}
request(other, finish_path, 200, "PUT", {"finish_slug": "light"})
assert request(account, finish_path, 200)[0] == {"finish_slug": "warm"}
print("Account checks passed: registration, login, revocation, validation, and separate saved finishes.")

mobile = build_opener()
mobile_headers = {"X-Aftro-Client": "mobile"}
mobile_email = f"{uuid4().hex}@example.test"
mobile_credentials = {"identifier": mobile_email, "password": PASSWORD}
request(mobile, "/room", 401)
request(mobile, "/room", 401, "PUT", {"width": 3.2, "length": 4.1, "height": 2.7, "source": "camera"})
mobile_profile, mobile_response = request(
    mobile, "/register", 201, "POST", mobile_credentials, mobile_headers,
)
assert mobile_profile["identifier"] == mobile_email
assert "Set-Cookie" not in mobile_response and mobile_response["Cache-Control"] == "no-store"
mobile_headers["Authorization"] = "Bearer " + mobile_profile["access_token"]
assert request(mobile, "/me", 200, extra_headers=mobile_headers)[0] == {
    "identifier": mobile_email, "kind": "email",
}
room = {"width": 3.2, "length": 4.1, "height": 2.7, "source": "camera", "finish": "light"}
request(mobile, "/room", 422, "PUT", {**room, "width": 0}, mobile_headers)
assert request(mobile, "/room", 200, "PUT", room, mobile_headers)[0] == room
assert request(mobile, "/room", 200, extra_headers=mobile_headers)[0] == room
assert request(other, "/room", 200)[0] is None
request(mobile, "/logout", 204, "POST", extra_headers=mobile_headers)
request(mobile, "/me", 401, extra_headers=mobile_headers)
login, _ = request(mobile, "/login", 200, "POST", mobile_credentials, {"X-Aftro-Client": "mobile"})
mobile_headers["Authorization"] = "Bearer " + login["access_token"]
assert request(mobile, "/room", 200, extra_headers=mobile_headers)[0] == room
print("Mobile checks passed: required auth, bearer sessions, room validation, persistence, and account isolation.")
