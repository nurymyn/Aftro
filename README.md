# Aftro

An AR renovation preview for unfinished apartments. The interactive design
prototype lets buyers explore the apartment, compare two finishes and try the
camera setup flow. The native [iPhone app](apps/mobile/README.md) adds live QR scanning and a camera that anchors a finish to the room.

## Repository layout

| Path | Purpose |
| --- | --- |
| `apps/web-preview/` | Interactive mobile interface presentation |
| `apps/mobile/` | Native SwiftUI and ARKit iPhone app |
| `services/api/` | Python apartment and renovation catalog API |
| `database/` | PostgreSQL schema and sample catalog |
| `docs/` | Architecture and the first demo |

## Local development

Run the API and PostgreSQL with Docker Compose.

```sh
docker compose up --build
```

Open the [interface prototype](http://localhost:8000/preview/) or
[API documentation](http://localhost:8000/docs).
The [virtual walkthrough](http://localhost:8000/preview/vr.html) opens the same
demo room in WebGL. Move with WASD or arrow keys while the room viewer is
focused, or use the viewpoint buttons. A compatible headset browser can use
immersive WebXR when the page is served in a secure context.
Stop the services with `docker compose down`.

You can also open `apps/web-preview/index.html` directly for a stand-alone
design review with the sample catalog. The browser saves the selected finish
on the current device.

## Project status

The browser supports before-and-after comparison and finish selection today.
The AR setup screen uses still images to simulate alignment. The
[mobile guide](apps/mobile/README.md) and [architecture notes](docs/architecture.md)
detail the planned camera integration.
The VR prototype uses a procedural room model, with three finish states and
headset controls for locomotion and finish switching. The 3D walkthrough works
on a desktop without a headset.

## Accounts

Open **Account** in the hosted prototype to register with email or a phone
number and password. Guest browsing and local finish selection remain
available. Signed-in users save and restore their finish through the API.
Use the number with its country code, such as `+7`. Passwords can be 15 to
128 characters. The browser keeps the session in an HTTP-only cookie.

Docker Compose runs the account migration for both new and existing database
volumes. For a standalone PostgreSQL setup, apply
`database/migrations/001_accounts.sql` after the catalog schema.

To enable genuine SMS verification, set `TWILIO_ACCOUNT_SID`,
`TWILIO_AUTH_TOKEN`, and `TWILIO_VERIFY_SERVICE_SID` in the server environment
or a local `.env` file before starting Compose. The phone is verified during
registration, and later sign-in uses the phone number and password. For an
HTTPS deployment, set `AFTRO_SECURE_COOKIES=1` on the API.

Run `python scripts/check-accounts.py` against the development API to verify
account isolation and logout. The check uses email and sends no SMS.

See [Contributing](CONTRIBUTING.md) for the branch and pull request workflow.
