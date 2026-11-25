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

See [Contributing](CONTRIBUTING.md) for the branch and pull request workflow.
