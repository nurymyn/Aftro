@echo off
setlocal
pushd "%~dp0" || exit /b 1
if not exist ".venv\Scripts\python.exe" (
    python -m venv .venv
    if errorlevel 1 goto :failed
)
".venv\Scripts\python.exe" -c "import psycopg" >nul 2>&1
if errorlevel 1 (
    ".venv\Scripts\python.exe" -m pip install "psycopg[binary]>=3.2,<4"
    if errorlevel 1 goto :failed
)
if "%~1"=="" (
    ".venv\Scripts\python.exe" scripts\import-room.py
) else (
    ".venv\Scripts\python.exe" scripts\import-room.py "%~1"
)
if errorlevel 1 goto :failed
popd
pause
exit /b 0

:failed
popd
pause
exit /b 1
