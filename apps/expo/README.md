# Aftro with Expo Go

## Start on Windows

Install [Node.js 24 LTS](https://nodejs.org/) and
[Expo Go for SDK 58](https://expo.dev/go) on the phone. Open the Aftro folder
that contains `apps` and run:

```powershell
cd apps/expo
npm.cmd install
npx.cmd expo login
npm.cmd start
```

Use the same free Expo account on iPhone and in the CLI. Connect the phone
and computer to the same Wi-Fi. Scan the terminal QR using the iPhone Camera
or Android Expo Go. The Aftro home screen, measurement and saving use local
data and work without the Python API.

## Measure and save

Open **Measure**. Enter the phone camera height and ceiling height. Stay
at the same spot and mark three consecutive floor corners along adjacent
walls. The estimate is for a rectangular room. You can also enter dimensions
manually. Change the finish, open the full 3D view and save the room on the
phone when it is ready.

## Open the saved room in pgAdmin

1. In **Saved**, tap **Export for pgAdmin**. Transfer the JSON file to Windows.
2. Start the local PostgreSQL service. In the Aftro folder, double-click
   `Import-Room.cmd` and select the JSON file. You can also drag the JSON
   file onto `Import-Room.cmd`.
3. At the prompt, enter the password for the local PostgreSQL role.
4. In pgAdmin, expand **Databases → aftro → Schemas → public → Tables** and
   open **aftro_offline_rooms → View/Edit Data → All Rows**. Refresh the
   Databases or Tables node if the first import just created it.

Importing the same file again keeps one row. A newer export of that room
updates the row and PostgreSQL calculates the material quantities. The
importer connects directly to PostgreSQL, so there is no Aftro API to start.
