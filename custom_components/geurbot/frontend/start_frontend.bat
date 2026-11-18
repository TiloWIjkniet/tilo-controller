
@echo off
title GeurBot Frontend

cd /d "%~dp0"

echo.
echo =================================
echo       GeurBot Frontend
echo =================================
echo.

if not exist "package.json" (
    echo ERROR: package.json not found!
    pause
    exit /b 1
)

echo Starting Vite...
echo Frontend: http://127.0.0.1:5173
echo Backend:  http://127.0.0.1:8000
echo.

npm run dev -- --host 127.0.0.1

echo.
echo Frontend stopped.
pause
