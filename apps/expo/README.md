# Aftro with Expo Go

## Start on Windows

Install [Node.js 24 LTS](https://nodejs.org/) and
[Expo Go for SDK 58](https://expo.dev/go) on the phone. Start the local PostgreSQL service. From the Aftro folder that contains
`apps`, start the account API in PowerShell:

```powershell
python -m pip install -r services/api/requirements.txt
python scripts/start-local.py --host 0.0.0.0
```

Enter the PostgreSQL role password. Keep that terminal open, then open a
second PowerShell window in the same Aftro folder and run:

```powershell
cd apps/expo
npm.cmd install
npx.cmd expo login
npm.cmd start
```

Use the same free Expo account on iPhone and in the CLI. Connect the phone
and computer to the same Wi-Fi. Scan the terminal QR using the iPhone Camera
or Android Expo Go. In Expo Go LAN mode the app uses the development
computer's local IP address and API port 8000. For an explicit address, set
`$env:EXPO_PUBLIC_AFTRO_API_URL = 'http://192.168.1.10:8000'` in the Expo terminal
before `npm.cmd start`, using your computer's actual IP address. For a
deployed API, set the variable to its HTTPS origin.

Create an account with email and a password. Phone registration uses the
API's SMS verification and needs its Twilio configuration. Sign-in and sign-up
on a new installation use the same accounts as the browser preview. After
successful authentication, the phone keeps a password verifier for local
sign-in. For an account made in an older offline-only version, choose
**Link to database** on the sign-in screen and enter its login and password.
The password verifier stays on the phone.

In pgAdmin or SQL Shell, connect to the `aftro` database and run:

```sql
SELECT id, identifier, kind FROM public.aftro_accounts ORDER BY id DESC;
```

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
room importer connects directly to PostgreSQL.
