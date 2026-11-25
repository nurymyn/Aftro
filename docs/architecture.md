# Architecture

## Mobile and camera

Unity C# owns the shared interface, room alignment, AR anchors and scene
rendering. AR Foundation connects to the platform tracking provider. The first
demo uses a measured room and manual alignment.

## Catalog

FastAPI exposes apartment details and finish options to the mobile app.
PostgreSQL stores the sample apartment and its finish packages. The API is
read-only in this milestone.

## 3D assets

Use Blender to build the room at real scale and use meters across the
3D pipeline. Keep a consistent coordinate origin and named surfaces so
both finish packages can use the same room geometry. GLB is the planned
delivery format for the room model.
