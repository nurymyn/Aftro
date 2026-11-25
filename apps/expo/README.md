# Aftro with Expo Go

## Start on Windows

1. Install [Node.js 24 LTS](https://nodejs.org/) and
   [Expo Go for SDK 58](https://expo.dev/go) on your phone.
2. Start Windows PostgreSQL and [run the Python API](../../README.md#local-development).
   In the repository root, bind it to the computer's actual Wi-Fi IPv4 address.

   ```powershell
   .\.venv\Scripts\python.exe scripts/start-local.py --host 192.168.1.42
   ```

3. Start Expo in a second terminal.

   ```powershell
   cd apps/expo
   npm.cmd install
   npx.cmd expo login
   npm.cmd start
   ```

4. Put the phone and computer on the same Wi-Fi. Scan Expo's terminal QR in
   the iPhone Camera or Android Expo Go. On iPhone, use the same Expo account
   as in the CLI.
5. At the sign-in screen, open **Server connection** and enter the running
   API address, for example `http://192.168.1.42:8000`. For a hosted server
   enter its HTTPS origin. You can also set `EXPO_PUBLIC_AFTRO_API_URL` before
   starting Expo.
6. Register with email or phone. Phone registration requires the API's
   [SMS provider settings](../../README.md#accounts).

## Measure a room

Open **Measure**. Enter the phone camera's height above the floor and the
ceiling height. Stand still, keep the phone at that height, and aim at three
consecutive floor corners along neighboring walls. The app estimates width
and length using the rear camera reticle and orientation sensors. If the
sensors are inaccurate or a corner is hidden, choose **Enter dimensions**.

The result shows a rectangular 3D model scaled to the dimensions, three
finish states, floor area, gross wall area, and flooring with a 10% allowance.
Doors, windows, and exact furniture are not scanned. Measurements are
approximate. Save the room to the current account and find it on **Home**.
