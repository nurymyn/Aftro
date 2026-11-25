# Aftro architecture

## Mobile client

The Expo app runs on Android and iPhone from the same React Native project.
It uses Expo Camera for the live camera and QR scanner. The apartment preview
and WebGL walkthrough use a WebView with an embedded sample for offline use.
The app stores language and guest finish preferences on the phone.

## API and database

FastAPI serves the catalog, accounts, saved finishes and the web interface.
PostgreSQL stores the room, renovation choices, accounts and sessions. A
connected Expo client opens the preview on the API's origin so the same
HTTP-only session cookie serves registration, sign-in and saved finishes.

## Room visualization

The room walkthrough builds geometry in WebGL. The camera alignment screen
uses still images to illustrate the two-step placement flow. A live camera
preview and a QR scanner are accessible from the Expo app's Camera tab.
