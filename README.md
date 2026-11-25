# Aftro

An AR renovation preview for unfinished apartments. Buyers use a phone to view
different finishes in the actual room. One Unity project targets Android and iOS,
and one Python API serves both platforms.

## Repository layout

| Path | Purpose |
| --- | --- |
| `apps/mobile/` | Shared Unity project for Android and iOS |
| `services/api/` | Python apartment and renovation catalog API |
| `database/` | PostgreSQL schema and sample catalog |
| `docs/` | Architecture and the first demo |

## Local development

Run the API and PostgreSQL with Docker Compose.

```sh
docker compose up --build
```

Open [API documentation](http://localhost:8000/docs) or
[the sample apartment](http://localhost:8000/api/v1/apartments/demo-apartment).
Stop the services with `docker compose down`.

The API binds to localhost by default. See the [mobile guide](apps/mobile/README.md)
for the planned on-device connection and AR flow.

## Project status

The first repository milestone is a read-only catalog. The mobile guide and
[architecture notes](docs/architecture.md) describe the implementation plan for
room alignment and switching renovation packages.

See [Contributing](CONTRIBUTING.md) for the branch and pull request workflow.
