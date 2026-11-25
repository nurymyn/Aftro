# Aftro architecture

## Mobile client

React Native and Expo Go provide the same measurement and saved-room
screens on Android and iPhone. A local sign-in is required before opening
the room tools. The password verifier and salt use device-only secure
storage. The account lives on one phone.

The measurement flow projects the center of
the live camera onto the floor using estimated phone height, gravity and
magnetic heading. Three corners produce two adjacent edges for a rectangular
room. The manual path supports editing or entering all three room dimensions.

The local WebGL renderer creates a room from the dimensions and applies a
selected finish. The app computes floor and gross wall area and includes a
10% flooring allowance. The camera estimate depends on holding the phone at
the entered height and position. It is intended for planning.

## Offline rooms and PostgreSQL

The mobile app saves the latest room on the phone and exports a versioned
JSON file. The Windows Python importer validates the file and inserts the
record directly into PostgreSQL. Reimporting a newer version of the same
room updates its existing row. pgAdmin can display the room and quantities.

The FastAPI service supports the browser preview, catalog and browser
accounts. The Expo app and the Python importer run independently of it.
