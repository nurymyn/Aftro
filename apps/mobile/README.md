# Aftro for iPhone

Aftro is a native SwiftUI app for iOS 17 and later. The demo apartment and
comparison open offline.

## Run on a device

1. Open `apps/mobile/Aftro.xcodeproj` in Xcode on a Mac.
2. Select the Aftro target and your development team under **Signing &
   Capabilities**. Choose an available bundle identifier for your team.
3. Connect your iPhone, choose it as the run destination and click **Run**.
   Follow Xcode's prompts for trust and Developer Mode.

Use **Compare finishes** to compare and save a style. In the AR camera, tap
the left floor corner of the back wall and then a point to its right along
that same wall. The finish picker changes the anchored room. The demo is a
4.5 × 3.6 m room with a 2.8 m ceiling. Camera and QR features require a
compatible physical device.

Scan `demo-apartment` or `aftro://apartment/demo-apartment` or enter
`demo-apartment` by hand.

## Accounts and VR

Start the [local PostgreSQL and Python API](../../README.md#local-development).
Bind the API to the computer's Wi-Fi address with `--host` for local phone
testing. In the iPhone app, open **Settings** and enter the API origin, such
as `http://192.168.1.42:8000`. Use HTTPS for a hosted server. Accounts and the browser's 3D/VR tour use the configured server.
Phone registration requires the Twilio Verify settings described in the
[root README](../../README.md#accounts).
