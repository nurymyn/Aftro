# Aftro architecture

## Mobile client

React Native and Expo Go provide the same sign-in, measurement and account
screens on Android and iPhone. The measurement flow projects the center of
the live camera onto the floor using estimated phone height, gravity and
magnetic heading. Three corners produce two adjacent edges for a rectangular
room. The manual path supports editing or entering all three room dimensions.

The local WebGL renderer creates a room from the dimensions and applies a
selected finish. The app computes floor and gross wall area and includes a
10% flooring allowance. The camera estimate depends on holding the phone at
the entered height and position. It is intended for planning.

## API and database

FastAPI provides the catalog, registration, login and saved rooms. PostgreSQL
stores accounts, hashed sessions and each account's most recently saved room.
Expo saves its session token in SecureStore and sends it to the configured API
origin. The browser uses an HTTP-only session cookie.
