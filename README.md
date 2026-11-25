# Aftro

An AR renovation preview for unfinished apartments. The interactive design
prototype lets buyers explore the apartment, compare two finishes and try the
camera setup flow. A shared Unity app is planned for on-device AR.

## Repository layout

| Path | Purpose |
| --- | --- |
| `apps/web-preview/` | Interactive mobile interface presentation |
| `apps/mobile/` | Unity AR implementation plan for Android and iOS |
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
Stop the services with `docker compose down`.

You can also open `apps/web-preview/index.html` directly for a stand-alone
design review with the sample catalog. The browser saves the selected finish
on the current device.

## Project status

The browser supports before-and-after comparison and finish selection today.
The AR setup screen uses still images to simulate alignment. The
[mobile guide](apps/mobile/README.md) and [architecture notes](docs/architecture.md)
detail the planned camera integration.

See [Contributing](CONTRIBUTING.md) for the branch and pull request workflow.
