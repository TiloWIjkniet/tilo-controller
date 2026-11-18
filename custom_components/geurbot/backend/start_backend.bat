
@echo off
title GeurBot Backend

cd /d "%~dp0\.."

echo.
echo =================================
echo       GeurBot Backend
echo =================================
echo.

echo Starting Python backend...
echo Backend: http://127.0.0.1:8000
echo.

py -m backend.standalone.server

echo.
echo Backend stopped.
pause
