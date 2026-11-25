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

Install Python and PostgreSQL and start the PostgreSQL service.
From the repository root on Windows, run:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r services/api/requirements.txt
.\.venv\Scripts\python.exe scripts/start-local.py
```

Enter the local PostgreSQL role password at the prompt. The defaults are
`postgres` on `127.0.0.1:5432` and the `aftro` database. The script creates the
database when the role has permission, prepares the schema and sample
apartment, and preserves existing records. Set `PGHOST`, `PGPORT`, `PGUSER`,
or `PGDATABASE` for other local settings. Set `DATABASE_URL` to use an
existing database connection directly.

In pgAdmin, expand **Databases → aftro → Schemas → public → Tables**.
Right-click a table and choose **View/Edit Data → All Rows**.
`apartments` and `finish_packages` contain the catalog.
`aftro_accounts` and `aftro_saved_finishes` contain registered accounts and
saved renovation choices.

Open the [interface prototype](http://localhost:8000/preview/) or
[API documentation](http://localhost:8000/docs).
The [virtual walkthrough](http://localhost:8000/preview/vr.html) opens the same
demo room in WebGL. Move with WASD or arrow keys while the room viewer is
focused, or use the viewpoint buttons. A compatible headset browser can use
immersive WebXR when the page is served in a secure context.
Stop the API with **Ctrl+C**. For an iPhone browser on the same Wi-Fi, start
with `--host <computer Wi-Fi IP>` and open that address on port 8000.

You can also open `apps/web-preview/index.html` directly for a stand-alone
design review with the sample catalog. The browser saves the selected finish
on the current device.

## Project status

The browser supports before-and-after comparison and finish selection today.
The browser's AR screen simulates alignment with still images. The native
[iPhone app](apps/mobile/README.md) uses the camera and ARKit.
The VR prototype uses a procedural room model, with three finish states and
headset controls for locomotion and finish switching. The 3D walkthrough works
on a desktop without a headset.

## Accounts

Open **Account** in the hosted prototype to register with email or a phone
number and password. Guest browsing and local finish selection remain
available. Signed-in users save and restore their finish through the API.
Use the number with its country code, such as `+7`. Passwords can be 15 to
128 characters. The browser keeps the session in an HTTP-only cookie.

For database setup only, run `python scripts/start-local.py --prepare-only`.
This applies the account migration to the same PostgreSQL database.

To enable genuine SMS verification, set `TWILIO_ACCOUNT_SID`,
`TWILIO_AUTH_TOKEN`, and `TWILIO_VERIFY_SERVICE_SID` in the server environment
before starting the API. The phone is verified during
registration, and later sign-in uses the phone number and password. For an
HTTPS deployment, set `AFTRO_SECURE_COOKIES=1` on the API.

Run `python scripts/check-accounts.py` against the development API to verify
account isolation and logout. The check uses email and sends no SMS.

See [Contributing](CONTRIBUTING.md) for the branch and pull request workflow.
