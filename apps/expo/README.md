# Aftro with Expo Go

Run the same Aftro project on Android and iPhone from Windows. The Expo app
includes the trilingual apartment preview, finish comparison, 3D walkthrough,
live phone camera, and a QR scanner. You can open the sample apartment
without starting Python or PostgreSQL.

## Start on Windows

1. Install [Node.js LTS](https://nodejs.org/).
2. On iPhone, install [Expo Go from the App Store](https://apps.apple.com/app/expo-go/id982107779).
   On Android, install the [SDK 54 version of Expo Go](https://expo.dev/go?sdkVersion=54&platform=android&device=true).
3. Connect the computer and both phones to the same Wi-Fi. From the repo root:

   ```powershell
   cd apps/expo
   npm install
   npx expo login
   npm start
   ```

4. Sign in to Expo Go on the iPhone with the same free Expo account as the
   CLI. Scan the terminal QR with the iPhone Camera or from Expo Go on Android.
   Keep the terminal open while using the app.

The Expo SDK is pinned to the version supported by Expo Go on the iPhone
App Store. The Android Expo Go SDK must match it.

## Connect the Python API

Follow the [local PostgreSQL setup](../../README.md#local-development).
In a second terminal at the repo root, bind the API to the Windows Wi-Fi
IPv4 address. Replace the example address with your own.

```powershell
.\.venv\Scripts\python.exe scripts/start-local.py --host 192.168.1.42
```

In Aftro open **Settings → Aftro server**, enter
`http://192.168.1.42:8000`, and tap **Connect**. Open **Account** on the
apartment page to sign in or register. Use an HTTPS origin for a hosted API.
Phone registration uses the server's [SMS settings](../../README.md#accounts).

## Camera and 3D

Open **Camera** for the live rear-camera view. Switch to **Scan QR** and point
at a QR code containing `aftro://apartment/demo-apartment` to open the demo
apartment. **3D tour** opens the WebGL room and its finish selector.
The on-site alignment on the apartment page is simulated. Anchored AR
requires a build with custom native tracking modules.

Run `npm run typecheck` and `npm run export` to check both bundles.
